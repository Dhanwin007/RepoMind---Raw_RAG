import { vectorSearch } from "./vectorSearch.ts";

const query = process.argv.slice(2).join(" ");

if (!query) {
    console.error("Please provide a query.");
    process.exit(1);
}

const results = await vectorSearch(query, 15);

for (const [index, result] of results.entries()) {
    console.log(`\n========== RESULT ${index + 1} ==========`);

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
        `Distance: ${result.score}`
    );

    console.log("\nContent:");
    console.log(result.content);
}