import bm25 from "wink-bm25-text-search";
import fs from "node:fs/promises";
import path from "node:path";

import type { CodeChunk } from "../ingestion/types.ts";


let bm25Index: ReturnType<typeof bm25> | null = null;

let indexedChunks: CodeChunk[] = [];

let repositoryName = "";


const BM25_DIR = path.join(
    process.cwd(),
    "data",
    "bm25"
);


function tokenize(text: string): string[] {

    return text
        .toLowerCase()
        .match(
            /[a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)*|[^\s]+/g
        ) ?? [];
}


export async function buildBM25Index(
    chunks: CodeChunk[],
    repoName: string
): Promise<void> {

    const index = bm25();

    index.defineConfig({
        fldWeights: {
            content: 1
        }
    });

    index.definePrepTasks([
        tokenize
    ]);


    for (let i = 0; i < chunks.length; i++) {

       const id =
    `${chunks[i].filePath}:${chunks[i].startLine}-${chunks[i].endLine}-${i}`;

index.addDoc(
    {
        content: chunks[i].content
    },
    id
);
    }


    index.consolidate();


    await fs.mkdir(
        BM25_DIR,
        {
            recursive: true
        }
    );


    const indexPath = path.join(
        BM25_DIR,
        `${repoName}.json`
    );


    await fs.writeFile(
        indexPath,
        index.exportJSON(),
        "utf-8"
    );


    await fs.writeFile(
        path.join(
            BM25_DIR,
            `${repoName}.chunks.json`
        ),
        JSON.stringify(
            chunks,
            null,
            2
        ),
        "utf-8"
    );


    bm25Index = index;

    indexedChunks = chunks;

    repositoryName = repoName;


    console.log(
        `BM25 index saved: ${indexPath}`
    );

    console.log(
        `Indexed ${chunks.length} chunks`
    );
}


export async function loadBM25Index(
    repoName: string
): Promise<void> {

    const index = bm25();

    index.defineConfig({
        fldWeights: {
            content: 1
        }
    });

    index.definePrepTasks([
        tokenize
    ]);


    const indexPath = path.join(
        BM25_DIR,
        `${repoName}.json`
    );


    const chunksPath = path.join(
        BM25_DIR,
        `${repoName}.chunks.json`
    );


    const indexJSON =
        await fs.readFile(
            indexPath,
            "utf-8"
        );


    const chunksJSON =
        await fs.readFile(
            chunksPath,
            "utf-8"
        );


    index.importJSON(
        indexJSON
    );


    bm25Index = index;

    indexedChunks =
        JSON.parse(chunksJSON);

    repositoryName = repoName;


    console.log(
        `BM25 index loaded: ${indexPath}`
    );

    console.log(
        `Loaded ${indexedChunks.length} chunks`
    );
}


export function getBM25Index() {

    if (!bm25Index) {

        throw new Error(
            "BM25 index has not been loaded."
        );
    }

    return bm25Index;
}


export function getIndexedChunks(): CodeChunk[] {

    if (!bm25Index) {

        throw new Error(
            "BM25 index has not been loaded."
        );
    }

    return indexedChunks;
}


export function getRepositoryName(): string {

    return repositoryName;
}