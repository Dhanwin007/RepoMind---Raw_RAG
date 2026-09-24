import fg from "fast-glob";
import ignore from "ignore";
import fs from "node:fs/promises";
import path from "node:path";

import type { CodeFile } from "./types.js";

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

const MAX_FILE_SIZE = 1_000_000;

const DEFAULT_IGNORES = [
    ".git",
    ".git/**",
    "node_modules",
    "node_modules/**"
];

const IGNORED_FILES = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "composer.lock"
];

async function findFiles(repoPath: string): Promise<string[]> {
    return fg("**/*", {
        cwd: repoPath,
        onlyFiles: true,
        dot: true
    });
}

async function createIgnoreFilter(repoPath: string) {
    const ig = ignore();

    try {
        const gitignorePath = path.join(
            repoPath,
            ".gitignore"
        );

        const gitignore = await fs.readFile(
            gitignorePath,
            "utf8"
        );

        ig.add(gitignore);
    } catch {
        // Repository has no .gitignore
    }

    ig.add(DEFAULT_IGNORES);

    return ig;
}

function getLanguage(filePath: string): string | null {
    const extension = path.extname(filePath).toLowerCase();

    return SUPPORTED_EXTENSIONS[extension] ?? null;
}

async function readCodeFile(
    repoPath: string,
    filePath: string,
    language: string
): Promise<CodeFile | null> {

    const fullPath = path.join(
        repoPath,
        filePath
    );

    const stats = await fs.stat(fullPath);

    if (stats.size > MAX_FILE_SIZE) {
        return null;
    }

    const content = await fs.readFile(
        fullPath,
        "utf8"
    );

    return {
        path: filePath,
        language,
        content,
        size: stats.size
    };
}

export async function scanRepository(
    repoPath: string
): Promise<CodeFile[]> {

    const filePaths = await findFiles(repoPath);

    const ignoreFilter = await createIgnoreFilter(
        repoPath
    );

    const codeFiles: CodeFile[] = [];

    for (const filePath of filePaths) {

        // .gitignore + default directory exclusions
        if (ignoreFilter.ignores(filePath)) {
            continue;
        }

        // Repository-generated lockfiles/artifacts
        const fileName = path.basename(filePath);

        if (IGNORED_FILES.includes(fileName)) {
            continue;
        }

        // Unsupported file extensions
        const language = getLanguage(filePath);

        if (!language) {
            continue;
        }

        // File-size protection
        const codeFile = await readCodeFile(
            repoPath,
            filePath,
            language
        );

        if (codeFile) {
            codeFiles.push(codeFile);
        }
    }

    return codeFiles;
}