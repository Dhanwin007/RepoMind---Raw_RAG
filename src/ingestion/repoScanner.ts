// import fg from "fast-glob";
// import ignore from "ignore";
// import fs from "node:fs/promises";
// import path from "node:path";

// import type { CodeFile } from "./types.js";

// const SUPPORTED_EXTENSIONS: Record<string, string> = {
//     ".ts": "typescript",
//     ".tsx": "typescript",
//     ".js": "javascript",
//     ".jsx": "javascript",
//     ".py": "python",
//     ".java": "java",
//     ".c": "c",
//     ".cpp": "cpp",
//     ".h": "c",
//     ".hpp": "cpp",
//     ".go": "go",
//     ".rs": "rust",
//     ".rb": "ruby",
//     ".php": "php",
//     ".cs": "csharp",
//     ".swift": "swift",
//     ".kt": "kotlin",

//     ".html": "html",
//     ".css": "css",
//     ".scss": "scss",

//     ".md": "markdown",
//     ".json": "json",
//     ".yaml": "yaml",
//     ".yml": "yaml",
//     ".xml": "xml",
//     ".sql": "sql"
// };

// const MAX_FILE_SIZE = 1_000_000;

// const DEFAULT_IGNORES = [
//     ".git",
//     ".git/**",
//     "node_modules",
//     "node_modules/**"
// ];

// const IGNORED_FILES = [
//     "package-lock.json",
//     "yarn.lock",
//     "pnpm-lock.yaml",
//     "Cargo.lock",
//     "composer.lock"
// ];

// async function findFiles(repoPath: string): Promise<string[]> {
//     return fg("**/*", {
//         cwd: repoPath,
//         onlyFiles: true,
//         dot: true
//     });
// }

// async function createIgnoreFilter(repoPath: string) {
//     const ig = ignore();

//     try {
//         const gitignorePath = path.join(
//             repoPath,
//             ".gitignore"
//         );

//         const gitignore = await fs.readFile(
//             gitignorePath,
//             "utf8"
//         );

//         ig.add(gitignore);
//     } catch {
//         // Repository has no .gitignore
//     }

//     ig.add(DEFAULT_IGNORES);

//     return ig;
// }

// function getLanguage(filePath: string): string | null {
//     const extension = path.extname(filePath).toLowerCase();

//     return SUPPORTED_EXTENSIONS[extension] ?? null;
// }

// async function readCodeFile(
//     repoPath: string,
//     filePath: string,
//     language: string
// ): Promise<CodeFile | null> {

//     const fullPath = path.join(
//         repoPath,
//         filePath
//     );

//     const stats = await fs.stat(fullPath);

//     if (stats.size > MAX_FILE_SIZE) {
//         return null;
//     }

//     const content = await fs.readFile(
//         fullPath,
//         "utf8"
//     );

//     return {
//         path: filePath,
//         language,
//         content,
//         size: stats.size
//     };
// }

// export async function scanRepository(
//     repoPath: string
// ): Promise<CodeFile[]> {

//     const filePaths = await findFiles(repoPath);

//     const ignoreFilter = await createIgnoreFilter(
//         repoPath
//     );

//     const codeFiles: CodeFile[] = [];

//     for (const filePath of filePaths) {

//         // .gitignore + default directory exclusions
//         if (ignoreFilter.ignores(filePath)) {
//             continue;
//         }

//         // Repository-generated lockfiles/artifacts
//         const fileName = path.basename(filePath);

//         if (IGNORED_FILES.includes(fileName)) {
//             continue;
//         }

//         // Unsupported file extensions
//         const language = getLanguage(filePath);

//         if (!language) {
//             continue;
//         }

//         // File-size protection
//         const codeFile = await readCodeFile(
//             repoPath,
//             filePath,
//             language
//         );

//         if (codeFile) {
//             codeFiles.push(codeFile);
//         }
//     }

//     return codeFiles;
// }
// 
/*The above code demonstrates how to run file discovery on github repo which has multiple branches and multiple extensions
 for a repo files stored on local disk but this is not effecint method so i decided to switch to using github api directly which is kind of 
 comparitively efficient. but ig difficult to write code for it. */
 
import ignore from "ignore";
import path from "node:path";

import type { CodeFile } from "./types.js";
import type { RepositoryFile } from "./repoLoader.js";

const SUPPORTED_EXTENSIONS: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".swift": "swift",
    ".kt": "kotlin",

    ".html": "html",
    ".css": "css",
    ".scss": "scss",

    ".md": "markdown",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".xml": "xml",
    ".sql": "sql"
};

const IGNORED_FILES = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "composer.lock"
]);

const DEFAULT_IGNORES = [
    ".git",
    ".git/**",
    "node_modules",
    "node_modules/**"
];

function getLanguage(filePath: string): string | null {
    const extension = path.posix.extname(filePath).toLowerCase();

    return SUPPORTED_EXTENSIONS[extension] ?? null;
}

function createIgnoreFilter(files: RepositoryFile[]) {
    const ig = ignore();

    const gitignore = files.find(
        file => file.path === ".gitignore"
    );

    if (gitignore) {
        ig.add(gitignore.content);
    }

    ig.add(DEFAULT_IGNORES);

    return ig;
}

export async function scanRepository(
    files: RepositoryFile[]
): Promise<CodeFile[]> {
    const ignoreFilter = createIgnoreFilter(files);
    const codeFiles: CodeFile[] = [];

    for (const file of files) {
        // Apply root .gitignore and default exclusions.
        if (ignoreFilter.ignores(file.path)) {
            continue;
        }

        const fileName = path.posix.basename(file.path);

        if (IGNORED_FILES.has(fileName)) {
            continue;
        }

        const language = getLanguage(file.path);

        if (!language) {
            continue;
        }

        if (file.size > 1_000_000) {
            continue;
        }

        codeFiles.push({
            path: file.path,
            language,
            content: file.content,
            size: file.size
        });
    }

    return codeFiles;
}

