// import { scanRepository } from "../ingestion/repoScanner.ts";
// import { chunkFile } from "./chunkFile.ts";

// async function main() {
//     const repoPath = process.argv[2];

//     if (!repoPath) {
//         console.error("Please provide a repository path.");
//         process.exit(1);
//     }

//     console.log("Scanning repository...");

//     const files = await scanRepository(repoPath);

//     console.log(`Found ${files.length} code files`);

//     let totalChunks = 0;

//     for (const file of files) {
//         try {
//             const chunks = chunkFile(file);

//             totalChunks += chunks.length;

//             console.log(
//                 `${file.path} → ${chunks.length} chunks`
//             );
//         } catch (error) {
//             console.error(
//                 `Failed to chunk ${file.path}`
//             );

//             console.error(error);
//         }
//     }

//     console.log(`\nTotal chunks: ${totalChunks}`);
// }

// main();
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

            if (
                file.path.endsWith(
                    "src/common/middleware/errorHandler.ts"
                )
            ) {
                console.log(
                    "\n========== errorHandler.ts CHUNKS ==========\n"
                );

                chunks.forEach((chunk, index) => {
                    console.log(
                        `\n--- CHUNK ${index + 1} ---`
                    );

                    console.log(
                        `File: ${chunk.filePath}`
                    );

                    console.log(
                        `Language: ${chunk.language}`
                    );

                    console.log(
                        `Type: ${chunk.type}`
                    );

                    console.log(
                        `Symbol: ${chunk.symbol ?? "none"}`
                    );

                    console.log(
                        `Lines: ${chunk.startLine}-${chunk.endLine}`
                    );

                    console.log(
                        "\nContent:"
                    );

                    console.log(
                        chunk.content
                    );
                });

                console.log(
                    "\n========== END errorHandler.ts ==========\n"
                );
            }
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