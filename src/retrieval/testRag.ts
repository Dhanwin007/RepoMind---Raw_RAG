import { loadBM25Index } from "./bm25Index.ts";
import { hybridSearch } from "./hybridSearch.ts";
import { buildContext } from "./contextBuilder.ts";

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


// Hybrid retrieval.
const results =
    await hybridSearch(
        query,
        5
    );


// Build LLM context.
const context =
    buildContext(
        results
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


// Generate answer using Groq.
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