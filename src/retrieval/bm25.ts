import {
    getBM25Index,
    getIndexedChunks
} from "./bm25Index.ts";

import type {
    RetrievalResult
} from "./types.ts";


export function bm25Search(
    query: string,
    topK: number = 5
): RetrievalResult[] {

    const index = getBM25Index();

    const chunks = getIndexedChunks();


    const results = index.search(
        query,
        topK
    );


    return results.map(
        ([id, score]) => {

            const chunkIndex = chunks.findIndex(
    (chunk, index) => {

        const chunkId =
            `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}-${index}`;

        return chunkId === String(id);
    }
);

const chunk = chunks[chunkIndex];


            return {
                id: String(id),

                content: chunk.content,

                score,

                metadata: {
                    filePath: chunk.filePath,
                    language: chunk.language,
                    startLine: chunk.startLine,
                    endLine: chunk.endLine,
                    symbol: chunk.symbol ?? "",
                    type: chunk.type
                }
            };
        }
    );
}