import Parser from "tree-sitter";

import type {
    CodeFile,
    CodeChunk
} from "../ingestion/types.ts";

import {
    findChunkNodes,
    getNodeName
} from "./astutils.ts";

import { getGrammar } from "./grammars.ts";


function getChunkType(
    language: string,
    nodeType: string
): string {

    switch (language) {

        case "javascript":
        case "typescript":

            switch (nodeType) {

                case "function_declaration":
                case "function":
                case "arrow_function":
                    return "function";

                case "class_declaration":
                    return "class";

                case "method_definition":
                    return "method";

                case "interface_declaration":
                    return "interface";

                case "type_alias_declaration":
                    return "type";

                case "enum_declaration":
                    return "enum";
            }

            break;


        case "python":

            switch (nodeType) {

                case "function_definition":
                    return "function";

                case "class_definition":
                    return "class";
            }

            break;


        case "java":

            switch (nodeType) {

                case "class_declaration":
                    return "class";

                case "method_declaration":
                    return "method";

                case "constructor_declaration":
                    return "constructor";

                case "interface_declaration":
                    return "interface";

                case "enum_declaration":
                    return "enum";
            }

            break;


        case "c":

            switch (nodeType) {

                case "function_definition":
                    return "function";

                case "struct_specifier":
                    return "struct";
            }

            break;


        case "cpp":

            switch (nodeType) {

                case "class_specifier":
                    return "class";

                case "function_definition":
                    return "function";

                case "struct_specifier":
                    return "struct";
            }

            break;


        case "go":

            switch (nodeType) {

                case "function_declaration":
                    return "function";

                case "method_declaration":
                    return "method";

                case "type_declaration":
                    return "type";
            }

            break;
    }

    return "unknown";
}
export function chunkCodeFile(
    file: CodeFile
): CodeChunk[] {

    const parser = new Parser();

    const grammar = getGrammar(
        file.language
    );

    parser.setLanguage(grammar);

    const tree = parser.parse(
        file.content
    );

   const nodes = findChunkNodes(
    tree,
    file.language
);
    if (nodes.length === 0) {

    return [
        {
            content: file.content,

            filePath: file.path,

            language: file.language,

            startLine: 1,

            endLine: file.content.split("\n").length,

            symbol: undefined,

            type: "file"
        }
    ];
}


    return nodes.map((node) => {

        return {
            content: file.content.slice(
                node.startIndex,
                node.endIndex
            ),

            filePath: file.path,

            language: file.language,

            startLine:
                node.startPosition.row + 1,

            endLine:
                node.endPosition.row + 1,

            symbol:
                getNodeName(
        node,
        file.language
    ),

            type:
                 getChunkType(
                    file.language,
                    node.type
    )
        };
    });
}