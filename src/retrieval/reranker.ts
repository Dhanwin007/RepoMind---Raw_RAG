
import {
    AutoTokenizer,
    AutoModel
} from "@huggingface/transformers";

import type {
    RetrievalResult
} from "./types.ts";


const MODEL_NAME =
    "tss-deposium/bge-reranker-v2-m3-onnx-int8";


let tokenizer:
    Awaited<
        ReturnType<typeof AutoTokenizer.from_pretrained>
    > | null = null;


let model:
    Awaited<
        ReturnType<typeof AutoModel.from_pretrained>
    > | null = null;


async function getReranker() {

    if (!tokenizer || !model) {

        console.log(
            "Loading reranker model..."
        );

        tokenizer =
            await AutoTokenizer.from_pretrained(
                MODEL_NAME
            );

        model =
            await AutoModel.from_pretrained(
                MODEL_NAME,
                {
                    dtype: "int8"
                }
            );

        console.log(
            "Reranker model loaded."
        );
    }

    return {
        tokenizer,
        model
    };
}


export async function rerank(
    query: string,
    results: RetrievalResult[],
    topK: number = 5
): Promise<RetrievalResult[]> {

    if (results.length === 0) {
        return [];
    }


    const {
        tokenizer,
        model
    } = await getReranker();


    const scoredResults: Array<{
        result: RetrievalResult;
        score: number;
    }> = [];


    for (const result of results) {

        /*
         * Important:
         *
         * The query and document must be
         * tokenized together as a pair.
         */
        const inputs =
            await tokenizer(
                query,
                {
                    text_pair: result.content,
                    truncation: true,
                    padding: true
                }
            );


        const output =
            await model(inputs);


        /*
         * BGE reranker produces a single
         * relevance logit.
         */
        const rawScore =
            Number(
                output.logits.data[0]
            );


        scoredResults.push({
            result,
            score: rawScore
        });
    }


    return scoredResults
        .sort(
            (a, b) =>
                b.score - a.score
        )
        .slice(0, topK)
        .map(
            ({ result, score }) => ({
                ...result,
                score
            })
        );
}

