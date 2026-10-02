// import type { CodeChunk } from "../ingestion/types.ts";
// import { getCollection } from "./chroma.ts";

// const BATCH_SIZE = 100;

// export async function indexChunks(
//     chunks: CodeChunk[]
// ): Promise<void> {

//     const collection = await getCollection();

//     for (
//         let start = 0;
//         start < chunks.length;
//         start += BATCH_SIZE
//     ) {

//         const batch = chunks.slice(
//             start,
//             start + BATCH_SIZE
//         );

//         const ids = batch.map(
//             (chunk, index) =>
//                 `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}-${start + index}`
//         );

//         const documents = batch.map(
//             chunk => chunk.content
//         );

//         const metadatas = batch.map(
//             chunk => ({
//                 filePath: chunk.filePath,
//                 language: chunk.language,
//                 startLine: chunk.startLine,
//                 endLine: chunk.endLine,
//                 symbol: chunk.symbol ?? "",
//                 type: chunk.type
//             })
//         );

//         await collection.upsert({
//             ids,
//             documents,
//             metadatas
//         });

//         console.log(
//             `Indexed ${Math.min(
//                 start + BATCH_SIZE,
//                 chunks.length
//             )}/${chunks.length} chunks`
//         );
//     }
// }
import type { CodeChunk } from "../ingestion/types.ts";
import { getCollection } from "./chroma.ts";

const BATCH_SIZE = 100;

function buildEmbeddingText(chunk: CodeChunk): string {
    return [
        `File: ${chunk.filePath}`,
        `Language: ${chunk.language}`,
        `Type: ${chunk.type}`,
        chunk.symbol ? `Symbol: ${chunk.symbol}` : "",
        "",
        chunk.content
    ]
        .filter(Boolean)
        .join("\n");
}

export async function indexChunks(
    chunks: CodeChunk[]
): Promise<void> {

    const collection = await getCollection();

    for (
        let start = 0;
        start < chunks.length;
        start += BATCH_SIZE
    ) {

        const batch = chunks.slice(
            start,
            start + BATCH_SIZE
        );

        const ids = batch.map(
            (chunk, index) =>
                `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}-${start + index}`
        );

        const documents = batch.map(
            chunk => buildEmbeddingText(chunk)
        );

        const metadatas = batch.map(
            chunk => ({
                filePath: chunk.filePath,
                language: chunk.language,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                symbol: chunk.symbol ?? "",
                type: chunk.type
            })
        );

        await collection.upsert({
            ids,
            documents,
            metadatas
        });

        console.log(
            `Indexed ${Math.min(
                start + BATCH_SIZE,
                chunks.length
            )}/${chunks.length} chunks`
        );
    }
}