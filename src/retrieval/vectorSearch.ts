import { getCollection } from "../vectorstore/chroma.ts";
import type { RetrievalResult } from "./types.ts";

export async function vectorSearch(
    query: string,
    topK: number = 10
): Promise<RetrievalResult[]> {

    const collection = await getCollection();

    const results = await collection.query({
        queryTexts: [query],
        nResults: topK,
        include: ["documents", "metadatas", "distances"]
    });

    const documents = results.documents[0] ?? [];
    const ids = results.ids[0] ?? [];
    const metadatas = results.metadatas[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    return documents.map((document, index) => {
        const metadata = metadatas[index] as RetrievalResult["metadata"];

        return {
            id: ids[index],
            content: document ?? "",
            score: distances[index] ?? 0,
            metadata
        };
    });
}