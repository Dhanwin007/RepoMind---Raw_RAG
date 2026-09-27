import { CloudClient } from "chromadb";
import ollama from "ollama";
import "dotenv/config";

const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY!,
    tenant: process.env.CHROMA_TENANT!,
    database: process.env.CHROMA_DATABASE!
});

const COLLECTION_NAME = "repomind";

const embedder = {
    async generate(texts: string[]): Promise<number[][]> {
        const response = await ollama.embed({
            model: "nomic-embed-text",
            input: texts
        });

        return response.embeddings;
    }
};

export async function getCollection() {
    return client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: embedder
    });
}

export async function resetCollection(): Promise<void> {

    try {
        await client.deleteCollection({
            name: COLLECTION_NAME
        });

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