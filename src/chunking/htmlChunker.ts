import Parser from "tree-sitter";

import type {
    CodeFile,
    CodeChunk
} from "../ingestion/types.ts";

import HTML from "tree-sitter-html";


const HTML_CHUNK_TAGS = new Set([
    "html",
    "head",
    "body",
    "header",
    "nav",
    "main",
    "section",
    "article",
    "aside",
    "footer",
    "form",
    "table",
    "script",
    "style"
]);


function getTagName(
    node: Parser.SyntaxNode
): string | undefined {

    const startTag =
        node.childForFieldName("start_tag");

    if (!startTag) {
        return undefined;
    }

    const tagName =
        startTag.childForFieldName("name");

    return tagName?.text;
}


function getHTMLChunkType(
    tagName: string
): string {

    switch (tagName) {

        case "form":
            return "form";

        case "nav":
            return "navigation";

        case "header":
            return "header";

        case "footer":
            return "footer";

        case "main":
            return "main";

        case "section":
            return "section";

        case "article":
            return "article";

        case "aside":
            return "aside";

        case "table":
            return "table";

        case "script":
            return "script";

        case "style":
            return "style";

        case "head":
            return "head";

        case "body":
            return "body";

        case "html":
            return "document";

        default:
            return "element";
    }
}


export function chunkHTML(
    file: CodeFile
): CodeChunk[] {

    const parser = new Parser();

    parser.setLanguage(HTML);

    const tree =
        parser.parse(file.content);

    const chunks: CodeChunk[] = [];


    function visit(
        node: Parser.SyntaxNode
    ): void {

        if (node.type === "element") {

            const tagName =
                getTagName(node);

            if (
                tagName &&
                HTML_CHUNK_TAGS.has(tagName)
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
                        tagName,

                    type:
                        getHTMLChunkType(tagName)
                });
            }
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