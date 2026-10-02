import type {
    RetrievalResult
} from "./types.ts";


export function buildContext(
    results: RetrievalResult[]
): string {

    return results
        .map((result, index) => {

            return [
                `--- SOURCE ${index + 1} ---`,
                `File: ${result.metadata.filePath}`,
                `Lines: ${result.metadata.startLine}-${result.metadata.endLine}`,
                `Language: ${result.metadata.language}`,
                `Type: ${result.metadata.type}`,
                "",
                result.content,
                ""
            ].join("\n");

        })
        .join("\n");
}