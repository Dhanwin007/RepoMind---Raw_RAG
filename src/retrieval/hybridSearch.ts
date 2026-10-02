import { vectorSearch } from "./vectorSearch.ts";
import { bm25Search } from "./bm25.ts";
import { reciprocalRankFusion } from "./rrf.ts";
import { rerank } from "./reranker.ts";

import type {
    RetrievalResult
} from "./types.ts";


export async function hybridSearch(
    query: string,
    topK: number = 5
): Promise<RetrievalResult[]> {

    // First-stage retrieval
    const [
        vectorResults,
        bm25Results
    ] = await Promise.all([
        vectorSearch(query, 15),
        Promise.resolve(
            bm25Search(query, 15)
        )
    ]);


    // Combine the two ranked lists
    const candidates =
        reciprocalRankFusion(
            [
                vectorResults,
                bm25Results
            ],
            10
        );


    // Second-stage retrieval
    const rerankedResults =
        await rerank(
            query,
            candidates,
            topK
        );


    return rerankedResults;
}