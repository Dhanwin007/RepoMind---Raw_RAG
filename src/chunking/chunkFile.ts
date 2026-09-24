import type {
    CodeFile,
    CodeChunk
} from "../ingestion/types.ts";

import { chunkCodeFile } from "./codeChunker.ts";
import { chunkHTML } from "./htmlChunker.ts";
import { chunkCSS } from "./cssChunker.ts";
import { chunkDocument,chunkMarkdown } from "./documentChunker.ts";


export function chunkFile(file: CodeFile): CodeChunk[] {
    switch (file.language) {
        case "html":
            return chunkHTML(file);

        case "css":
        case "scss":
            return chunkCSS(file);

        case "json":
            return chunkDocument(file);

        case "yaml":
            return [];

        case "markdown":
            return chunkMarkdown(file);    

        default:
            return chunkCodeFile(file);
    }
}