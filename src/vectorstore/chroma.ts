import { CloudClient } from "chromadb";
import { VoyageAIEmbeddingFunction } from "@chroma-core/voyageai";
import "dotenv/config";

const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY!,
    tenant: process.env.CHROMA_TENANT!,
    database: process.env.CHROMA_DATABASE!
});

const embedder = new VoyageAIEmbeddingFunction({
    apiKey: process.env.VOYAGE_API_KEY!,
    modelName: "voyage-code-4"
});

const COLLECTION_NAME = "repomind";

export async function getCollection() {
    return client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: embedder
    });
}

export async function resetCollection(): Promise<void> {

    try {
        await client.deleteCollection(
            { name: COLLECTION_NAME });
        

        console.log(
            "Old Chroma collection deleted."
        );

    } catch {
        console.log(
            "No existing Chroma collection to delete."
        );
    }

    await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: embedder
    });

    console.log(
        "New Chroma collection created."
    );
}