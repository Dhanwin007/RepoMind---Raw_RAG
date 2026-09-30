import type { RetrievalResult } from "./types.ts";


const RRF_K = 60;


export function reciprocalRankFusion(
    resultLists: RetrievalResult[][],
    topK: number = 10
): RetrievalResult[] {

    const scores = new Map<
        string,
        {
            result: RetrievalResult;
            score: number;
        }
    >();


    for (const results of resultLists) {

        for (
            const [rank, result]
            of results.entries()
        ) {

            const rrfScore =
                1 / (RRF_K + rank + 1);


            const existing =
                scores.get(result.id);


            if (existing) {

                existing.score += rrfScore;

            } else {

                scores.set(
                    result.id,
                    {
                        result,
                        score: rrfScore
                    }
                );
            }
        }
    }


    return Array.from(
        scores.values()
    )
        .sort(
            (a, b) =>
                b.score - a.score
        )
        .slice(0, topK)
        .map(item => ({
            ...item.result,
            score: item.score
        }));
}