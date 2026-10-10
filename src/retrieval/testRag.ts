// import { loadBM25Index } from "./bm25Index.ts";
// import { hybridSearch } from "./hybridSearch.ts";
// import { buildContext } from "./contextBuilder.ts";

// import { generateAnswer } from "../llm/groq.ts";


// const repoName =
//     process.argv[2];


// const query =
//     process.argv
//         .slice(3)
//         .join(" ");


// if (!repoName) {

//     console.error(
//         "Please provide repository name."
//     );

//     process.exit(1);
// }


// if (!query) {

//     console.error(
//         "Please provide a query."
//     );

//     process.exit(1);
// }


// // Load persisted BM25 index.
// await loadBM25Index(
//     repoName
// );


// // Hybrid retrieval.
// const results =
//     await hybridSearch(
//         query,
//         5
//     );


// // Build LLM context.
// const context =
//     buildContext(
//         results
//     );


// console.log(
//     "\n========== CONTEXT ==========\n"
// );

// console.log(
//     context
// );


// console.log(
//     "\n========== GENERATING ANSWER ==========\n"
// );


// // Generate answer using Groq.
// const answer =
//     await generateAnswer(
//         query,
//         context
//     );


// console.log(
//     "\n========== REPO MIND ANSWER ==========\n"
// );

// console.log(
//     answer
// );

import { loadBM25Index } from "./bm25Index.ts";
import { hybridSearch } from "./hybridSearch.ts";
import { buildContext } from "./contextBuilder.ts";
import { decomposeQuery } from "./queryDecomposer.ts";

import { generateAnswer } from "../llm/groq.ts";


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


// Load persisted BM25 index.
await loadBM25Index(
    repoName
);


// Decompose the original question.
const subqueries =
    await decomposeQuery(query);


// Keep the original question and add unique subqueries.
const queries = [
    query,
    ...subqueries.filter(
        subquery =>
            subquery.toLowerCase() !== query.toLowerCase()
    )
];


console.log(
    "\n========== RETRIEVAL QUERIES ==========\n"
);

queries.forEach((currentQuery, index) => {
    console.log(
        `${index + 1}. ${currentQuery}`
    );
});


// Hybrid retrieval for every query.
const resultLists =
    await Promise.all(
        queries.map(currentQuery =>
            hybridSearch(
                currentQuery,
                5
            )
        )
    );


// Merge results and remove duplicate chunks.
const uniqueResults = new Map<
    string,
    (typeof resultLists)[number][number]
>();

for (const results of resultLists) {

    for (const result of results) {

        const key = [
            result.metadata.filePath,
            result.metadata.startLine,
            result.metadata.endLine
        ].join(":");

        if (!uniqueResults.has(key)) {
            uniqueResults.set(key, result);
        }
    }
}


const mergedResults = [
    ...uniqueResults.values()
];


// Build LLM context from retrieved evidence.
const context =
    buildContext(
        mergedResults
    );


console.log(
    "\n========== CONTEXT ==========\n"
);

console.log(
    context
);


console.log(
    "\n========== GENERATING ANSWER ==========\n"
);


// Generate the final answer using the original question.
const answer =
    await generateAnswer(
        query,
        context
    );


console.log(
    "\n========== REPO MIND ANSWER ==========\n"
);

console.log(
    answer
);
