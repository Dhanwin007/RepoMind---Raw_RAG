import { simpleGit } from "simple-git";

import path from "node:path";
import fs from "node:fs/promises";

import type { Repository } from "./types.js";

function extractRepoName(url: string): string {
    const cleanUrl = url.replace(/\/$/, "");

    const repoName = cleanUrl.split("/").pop();

    if (!repoName) {
        throw new Error("Invalid GitHub repository URL");
    }

    return repoName.replace(/\.git$/, "");
}

async function repositoryExists(
    localPath: string
): Promise<boolean> {
    try {
        await fs.access(localPath);
        return true;
    } catch {
        return false;
    }
}

export async function cloneRepository(
    url: string
): Promise<Repository> {

    const repoName = extractRepoName(url);

    const localPath = path.join(
        process.cwd(),
        "data",
        "repos",
        repoName
    );

    if (await repositoryExists(localPath)) {
        console.log("Repository already exists.");

        return {
            name: repoName,
            url,
            localPath
        };
    }

    await fs.mkdir(
        path.dirname(localPath),
        { recursive: true }
    );

    console.log(`Cloning ${repoName}...`);

    const git = simpleGit();

    await git.clone(url, localPath);

    console.log("Repository cloned successfully.");

    return {
        name: repoName,
        url,
        localPath
    };
}