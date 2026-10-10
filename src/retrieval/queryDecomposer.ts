
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const MODEL = "openai/gpt-oss-120b";

export async function decomposeQuery(
    question: string
): Promise<string[]> {
    const response = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `
You decompose questions about software repositories
into focused, independent code-retrieval queries.

Return valid JSON with this shape:
{"queries": ["query 1", "query 2"]}

Rules:
- If the question needs only one focused search,
  return {"queries": []}.
- For broad questions, generate 2 to 4 focused queries.
- Never include the original question as a subquery.
- Never copy or lightly rephrase the original question.
- Every subquery must target a distinct information need.
- Each query should retrieve a different piece of evidence.
- Keep queries specific to finding actual source code.
- Separate finding where something is registered or used
  from finding where it is implemented.
- For listing requests, search for declarations,
  implementations, and relevant behavior when appropriate.
- Do not invent filenames, symbols, or technologies.
- Do not answer the original question.
- Avoid duplicate or overlapping queries.
- Return only the JSON object, with no extra text.
`
            },
            {
                role: "user",
                content: question
            }
        ]
    });

    const content = response.choices[0]?.message.content;

    if (!content) {
        return [];
    }

    try {
        const parsed: { queries?: unknown } = JSON.parse(content);

        if (!Array.isArray(parsed.queries)) {
            return [];
        }

        const normalize = (value: string): string =>
            value
                .trim()
                .toLowerCase()
                .replace(/[?!.,;:]+$/g, "")
                .replace(/\s+/g, " ");

        const originalQuestion = normalize(question);

        const queries = parsed.queries
            .filter(
                (query): query is string =>
                    typeof query === "string"
            )
            .map(query => query.trim())
            .filter(Boolean)
            .filter(query => normalize(query) !== originalQuestion);

        return [...new Set(queries)].slice(0, 4);
    } catch {
        console.error("Could not parse decomposed queries.");
        return [];
    }
}
