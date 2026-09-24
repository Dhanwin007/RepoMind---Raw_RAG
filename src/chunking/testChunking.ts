import { scanRepository } from "../ingestion/repoScanner.ts";
import { chunkFile } from "./chunkFile.ts";

async function main() {
    const repoPath = process.argv[2];

    if (!repoPath) {
        console.error("Please provide a repository path.");
        process.exit(1);
    }

    console.log("Scanning repository...");

    const files = await scanRepository(repoPath);

    console.log(`Found ${files.length} code files`);

    let totalChunks = 0;

    for (const file of files) {
        try {
            const chunks = chunkFile(file);

            totalChunks += chunks.length;

            console.log(
                `${file.path} → ${chunks.length} chunks`
            );
        } catch (error) {
            console.error(
                `Failed to chunk ${file.path}`
            );

            console.error(error);
        }
    }

    console.log(`\nTotal chunks: ${totalChunks}`);
}

main();