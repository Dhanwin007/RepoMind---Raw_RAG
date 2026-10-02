import { loadBM25Index } from "./bm25Index.ts";
import { hybridSearch } from "./hybridSearch.ts";


const repoName = process.argv[2];

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


// BM25 is persisted separately,
// so load it before hybrid retrieval.
await loadBM25Index(
    repoName
);


console.log(
    `\nRepository: ${repoName}`
);

console.log(
    `Query: ${query}`
);


const results =
    await hybridSearch(
        query,
        5
    );


console.log(
    "\n========== HYBRID RESULTS =========="
);


for (
    const [index, result]
    of results.entries()
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
        `Lines: ${result.metadata.startLine}-${result.metadata.endLine}`
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