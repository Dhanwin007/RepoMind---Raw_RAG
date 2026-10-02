import {
    loadBM25Index,
    getRepositoryName
} from "./bm25Index.ts";

import {
    bm25Search
} from "./bm25.ts";


const repoName = process.argv[2];

const query =
    process.argv.slice(3).join(" ");


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


await loadBM25Index(
    repoName
);


console.log(
    `\nRepository: ${getRepositoryName()}`
);


const results =
    bm25Search(
        query,
        20
    );


for (
    const [index, result]
    of results.entries()
) {

    console.log(
        `\n========== RESULT ${index + 1} ==========`
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
        `BM25 Score: ${result.score}`
    );

    console.log(
        "\nContent:"
    );

    console.log(
        result.content
    );
}