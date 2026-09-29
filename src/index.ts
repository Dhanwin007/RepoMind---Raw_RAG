import { cloneRepository } from "./ingestion/repoLoader.ts";
import { scanRepository } from "./ingestion/repoScanner.ts";
import { chunkFile } from "./chunking/chunkFile.ts";

import { indexChunks } from "./vectorstore/indexChunks.ts";

import {
    resetCollection
} from "./vectorstore/chroma.ts";

import {
    buildBM25Index
} from "./retrieval/bm25Index.ts";


async function main() {

    const url = process.argv[2];

    if (!url) {

        console.error(
            "Please provide a GitHub repository URL."
        );

        process.exit(1);
    }


    const repository =
        await cloneRepository(url);


    const files =
        await scanRepository(
            repository.localPath
        );


    console.log(
        `Found ${files.length} code files`
    );


    const allChunks = [];


    for (const file of files) {

        try {

            const chunks =
                chunkFile(file);

            allChunks.push(...chunks);

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


    console.log(
        `\nTotal chunks: ${allChunks.length}`
    );


    console.log(
        "\nResetting Chroma collection..."
    );

    await resetCollection();


    console.log(
        `Indexing ${allChunks.length} chunks...`
    );

    await indexChunks(allChunks);


    console.log(
        "Chroma indexing completed."
    );


    console.log(
        "\nBuilding BM25 index..."
    );


    await buildBM25Index(
        allChunks,
        repository.name
    );


    console.log(
        "BM25 indexing completed."
    );


    console.log(
        `\nRepository "${repository.name}" is ready.`
    );
}


main();