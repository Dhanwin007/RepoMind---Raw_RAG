// import { simpleGit } from "simple-git";

// import path from "node:path";
// import fs from "node:fs/promises";

// import type { Repository } from "./types.js";

// function extractRepoName(url: string): string {
//     const cleanUrl = url.replace(/\/$/, "");

//     const repoName = cleanUrl.split("/").pop();

//     if (!repoName) {
//         throw new Error("Invalid GitHub repository URL");
//     }

//     return repoName.replace(/\.git$/, "");
// }

// async function repositoryExists(
//     localPath: string
// ): Promise<boolean> {
//     try {
//         await fs.access(localPath);
//         return true;
//     } catch {
//         return false;
//     }
// }

// export async function cloneRepository(
//     url: string
// ): Promise<Repository> {

//     const repoName = extractRepoName(url);

//     const localPath = path.join(
//         process.cwd(),
//         "data",
//         "repos",
//         repoName
//     );

//     if (await repositoryExists(localPath)) {
//         console.log("Repository already exists.");

//         return {
//             name: repoName,
//             url,
//             localPath
//         };
//     }

//     await fs.mkdir(
//         path.dirname(localPath),
//         { recursive: true }
//     );

//     console.log(`Cloning ${repoName}...`);

//     const git = simpleGit();

//     await git.clone(url, localPath);

//     console.log("Repository cloned successfully.");

//     return {
//         name: repoName,
//         url,
//         localPath
//     };
// } 
//The above was for local cloning of the repo. For remote file discovery, you can use the following code throgh github api:

type GitHubRepositoryResponse = {
    default_branch: string;
};

type GitHubBranchResponse = {
    commit: {
        sha: string;
    };
};

type GitHubTreeEntry = {
    path: string;
    type: string;
    size?: number;
};

type GitHubTreeResponse = {
    truncated: boolean;
    tree: GitHubTreeEntry[];
};

export type RepositoryFile = {
    path: string;
    content: string;
    size: number;
};

export type RepositorySnapshot = {
    name: string;
    url: string;
    files: RepositoryFile[];
};

const MAX_FILE_SIZE = 1_000_000;

const SUPPORTED_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx",
    ".py", ".java", ".c", ".cpp", ".h", ".hpp",
    ".go", ".rs", ".rb", ".php", ".cs", ".swift",
    ".kt", ".html", ".css", ".scss",
    ".md", ".json", ".yaml", ".yml", ".xml", ".sql"
]);

async function githubFetch<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    });

    if (!response.ok) {
        throw new Error(
            `GitHub request failed (${response.status}): ${url}`
        );
    }

    return response.json() as Promise<T>;
}

function parseGitHubUrl(url: string) {
    const parsed = new URL(url);

    if (
        parsed.hostname !== "github.com" ||
        !["https:", "http:"].includes(parsed.protocol)
    ) {
        throw new Error("Expected a github.com repository URL");
    }

    const parts = parsed.pathname
        .replace(/\.git\/?$/, "")
        .split("/")
        .filter(Boolean);

    if (parts.length !== 2) {
        throw new Error("Invalid GitHub repository URL");
    }

    const [owner, repo] = parts;

    if (!owner || !repo) {
        throw new Error("Invalid GitHub repository URL");
    }

    return { owner, repo };
}

function shouldFetchFile(file: GitHubTreeEntry): boolean {
    if (file.type !== "blob") return false;

    if (file.size === undefined || file.size > MAX_FILE_SIZE) {
        return false;
    }

    // The scanner needs this file to apply ignore rules.
    if (file.path === ".gitignore") return true;

    const extension = file.path
        .slice(file.path.lastIndexOf("/") + 1)
        .split(".")
        .slice(1)
        .join(".");

    const dotIndex = file.path.lastIndexOf("/");
    const fileName = file.path.slice(dotIndex + 1);
    const extensionIndex = fileName.lastIndexOf(".");

    const fileExtension =
        extensionIndex >= 0
            ? fileName.slice(extensionIndex).toLowerCase()
            : "";

    return SUPPORTED_EXTENSIONS.has(fileExtension);
}

export async function fetchRepository(
    url: string
): Promise<RepositorySnapshot> {
    const { owner, repo } = parseGitHubUrl(url);

    const apiBase =
        `https://api.github.com/repos/${owner}/${repo}`;

    console.log(`Fetching ${owner}/${repo} from GitHub...`);

    const metadata =
        await githubFetch<GitHubRepositoryResponse>(apiBase);

    const branchPath = metadata.default_branch
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    const branch = await githubFetch<GitHubBranchResponse>(
        `${apiBase}/branches/${branchPath}`
    );

    // Pin all subsequent requests to one commit.
    const commitSha = branch.commit.sha;

    const tree = await githubFetch<GitHubTreeResponse>(
        `${apiBase}/git/trees/${commitSha}?recursive=1`
    );

    if (tree.truncated) {
        throw new Error(
            "GitHub returned a truncated file tree. " +
            "This repository cannot be indexed completely by this loader."
        );
    }

    const filesToFetch = tree.tree.filter(shouldFetchFile);
    const files: RepositoryFile[] = [];

    console.log(`Fetching ${filesToFetch.length} candidate files...`);

    for (const file of filesToFetch) {
        const encodedPath = file.path
            .split("/")
            .map(encodeURIComponent)
            .join("/");

        const rawUrl =
            `https://raw.githubusercontent.com/${owner}/${repo}/` +
            `${commitSha}/${encodedPath}`;

        const response = await fetch(rawUrl);

        if (!response.ok) {
            throw new Error(
                `Could not fetch ${file.path}: HTTP ${response.status}`
            );
        }

        const content = await response.text();
        const size = Buffer.byteLength(content, "utf8");

        // Protect against content changing or exceeding the limit.
        if (size > MAX_FILE_SIZE) continue;

        files.push({
            path: file.path,
            content,
            size
        });
    }

    console.log(`Fetched ${files.length} files into memory.`);

    return {
        name: repo,
        url,
        files
    };
}
