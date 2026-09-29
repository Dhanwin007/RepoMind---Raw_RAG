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

            const chunk =
                chunks[Number(id)];


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