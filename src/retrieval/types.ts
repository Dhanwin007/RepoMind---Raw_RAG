export interface RetrievalResult {
    id: string;
    content: string;
    score: number;
    metadata: {
        filePath: string;
        language: string;
        startLine: number;
        endLine: number;
        symbol: string;
        type: string;
    };
}