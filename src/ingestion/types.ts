export interface Repository {
    name: string;
    url: string;
    localPath: string;
}

export interface CodeFile {
    path: string;
    language: string;
    content: string;
    size: number;
}

export interface CodeChunk {
    content: string;
    filePath: string;
    language: string;
    startLine: number;
    endLine: number;
    symbol?: string;
    type: string;
}