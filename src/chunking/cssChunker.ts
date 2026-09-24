import Parser from "tree-sitter";

import type {
    CodeFile,
    CodeChunk
} from "../ingestion/types.ts";

import CSS from "tree-sitter-css";


function getSelector(
    node: Parser.SyntaxNode
): string | undefined {

    const selectors =
        node.childForFieldName("selectors");

    return selectors?.text.trim();
}


function getCSSChunkType(
    nodeType: string
): string {

    switch (nodeType) {

        case "rule_set":
            return "rule";

        case "media_statement":
            return "media";

        default:
            return "css";
    }
}


export function chunkCSS(
    file: CodeFile
): CodeChunk[] {

    const parser = new Parser();

    parser.setLanguage(CSS);

    const tree =
        parser.parse(file.content);

    const chunks: CodeChunk[] = [];


    function visit(
        node: Parser.SyntaxNode
    ): void {

        if (
            node.type === "rule_set" ||
            node.type === "media_statement"
        ) {

            chunks.push({
                content:
                    file.content.slice(
                        node.startIndex,
                        node.endIndex
                    ),

                filePath:
                    file.path,

                language:
                    file.language,

                startLine:
                    node.startPosition.row + 1,

                endLine:
                    node.endPosition.row + 1,

                symbol:
                    node.type === "rule_set"
                        ? getSelector(node)
                        : node.text
                            .split("{")[0]
                            .trim(),

                type:
                    getCSSChunkType(node.type)
            });
        }


        for (const child of node.namedChildren) {
            visit(child);
        }
    }


    visit(tree.rootNode);


    if (chunks.length === 0) {

        return [
            {
                content: file.content,

                filePath: file.path,

                language: file.language,

                startLine: 1,

                endLine:
                    file.content.split("\n").length,

                symbol: undefined,

                type: "file"
            }
        ];
    }


    return chunks;
}