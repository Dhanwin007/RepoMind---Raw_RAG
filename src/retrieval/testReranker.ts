import {
    loadBM25Index
} from "./bm25Index.ts";

import {
    vectorSearch
} from "./vectorSearch.ts";

import {
    bm25Search
} from "./bm25.ts";

import {
    reciprocalRankFusion
} from "./rrf.ts";

import {
    rerank
} from "./reranker.ts";


const repoName =
    process.argv[2];

const query =
    process.argv
        .slice(3)
        .join(" ");


if (!repoName) {

    console.error(
        "Please provide repository name."
    );

    process.exit(1);
}


if (!query) {

    console.error(
        "Please provide a query."
    );

    process.exit(1);
}


/*
 * Load persistent BM25 index.
 */

await loadBM25Index(
    repoName
);


/*
 * Run both retrieval systems.
 */

const [
    vectorResults,
    bm25Results
] = await Promise.all([

    vectorSearch(
        query,
        15
    ),

    Promise.resolve(
        bm25Search(
            query,
            15
        )
    )

]);


/*
 * Fuse vector + BM25 rankings.
 */

const fusedResults =
    reciprocalRankFusion(
        [
            vectorResults,
            bm25Results
        ],
        10
    );


/*
 * Show RRF ranking.
 */

console.log(
    "\n========== RRF RESULTS =========="
);


for (
    const [index, result]
    of fusedResults.entries()
) {

    console.log(
        `\n${index + 1}. ` +
        `${result.metadata.filePath}:` +
        `${result.metadata.startLine}-` +
        `${result.metadata.endLine}`
    );

    console.log(
        `Symbol: ${result.metadata.symbol}`
    );

    console.log(
        `RRF Score: ${result.score}`
    );
}


/*
 * Rerank RRF candidates.
 */

console.log(
    "\n\nLoading reranker..."
);


const rerankedResults =
    await rerank(
        query,
        fusedResults,
        5
    );


/*
 * Show final reranked results.
 */

console.log(
    "\n========== RERANKED RESULTS =========="
);


for (
    const [index, result]
    of rerankedResults.entries()
) {

    console.log(
        `\n========== RESULT ${index + 1} ==========`
    );

    console.log(
        `Reranker Score: ${result.score}`
    );

    console.log(
        `File: ${result.metadata.filePath}`
    );

    console.log(
        `Lines: ` +
        `${result.metadata.startLine}-` +
        `${result.metadata.endLine}`
    );

    console.log(
        `Symbol: ${result.metadata.symbol}`
    );

    console.log(
        `Type: ${result.metadata.type}`
    );

    console.log(
        "\nContent:"
    );

    console.log(
        result.content
    );
}