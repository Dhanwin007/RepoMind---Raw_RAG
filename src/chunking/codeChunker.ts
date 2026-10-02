// import Parser from "tree-sitter";

// import type {
//     CodeFile,
//     CodeChunk
// } from "../ingestion/types.ts";

// import {
//     findChunkNodes,
//     getNodeName
// } from "./astutils.ts";

// import { getGrammar } from "./grammars.ts";


// const MAX_CHUNK_SIZE = 2500;


// function getChunkType(
//     language: string,
//     nodeType: string
// ): string {

//     switch (language) {

//         case "javascript":
//         case "typescript":

//             switch (nodeType) {

//                 case "function_declaration":
//                 case "function":
//                 case "arrow_function":
//                     return "function";

//                 case "class_declaration":
//                     return "class";

//                 case "method_definition":
//                     return "method";

//                 case "interface_declaration":
//                     return "interface";

//                 case "type_alias_declaration":
//                     return "type";

//                 case "enum_declaration":
//                     return "enum";
//             }

//             break;


//         case "python":

//             switch (nodeType) {

//                 case "function_definition":
//                     return "function";

//                 case "class_definition":
//                     return "class";
//             }

//             break;


//         case "java":

//             switch (nodeType) {

//                 case "class_declaration":
//                     return "class";

//                 case "method_declaration":
//                     return "method";

//                 case "constructor_declaration":
//                     return "constructor";

//                 case "interface_declaration":
//                     return "interface";

//                 case "enum_declaration":
//                     return "enum";
//             }

//             break;


//         case "c":

//             switch (nodeType) {

//                 case "function_definition":
//                     return "function";

//                 case "struct_specifier":
//                     return "struct";
//             }

//             break;


//         case "cpp":

//             switch (nodeType) {

//                 case "class_specifier":
//                     return "class";

//                 case "function_definition":
//                     return "function";

//                 case "struct_specifier":
//                     return "struct";
//             }

//             break;


//         case "go":

//             switch (nodeType) {

//                 case "function_declaration":
//                     return "function";

//                 case "method_declaration":
//                     return "method";

//                 case "type_declaration":
//                     return "type";
//             }

//             break;
//     }

//     return "unknown";
// }


// /*
//  * Creates a CodeChunk from an AST node.
//  */
// function createChunk(
//     file: CodeFile,
//     node: Parser.SyntaxNode,
//     symbol?: string,
//     type?: string
// ): CodeChunk {

//     return {
//         content: file.content.slice(
//             node.startIndex,
//             node.endIndex
//         ),

//         filePath: file.path,

//         language: file.language,

//         startLine:
//             node.startPosition.row + 1,

//         endLine:
//             node.endPosition.row + 1,

//         symbol:
//             symbol ?? getNodeName(
//                 node,
//                 file.language
//             ),

//         type:
//             type ?? getChunkType(
//                 file.language,
//                 node.type
//             )
//     };
// }


// /*
//  * Splits an oversized semantic node using
//  * its named AST children.
//  */
// function splitLargeNode(
//     file: CodeFile,
//     node: Parser.SyntaxNode
// ): CodeChunk[] {

//     const children = node.namedChildren;

//     if (children.length === 0) {
//         return [
//             createChunk(file, node)
//         ];
//     }

//     const chunks: CodeChunk[] = [];

//     let currentStart = children[0].startIndex;
//     let currentEnd = children[0].endIndex;

//     for (const child of children) {

//         const proposedEnd = child.endIndex;

//         const proposedContent =
//             file.content.slice(
//                 currentStart,
//                 proposedEnd
//             );

//         if (
//             proposedContent.length >
//             MAX_CHUNK_SIZE
//         ) {

//             if (currentStart !== child.startIndex) {

//                 chunks.push({
//                     content: file.content.slice(
//                         currentStart,
//                         currentEnd
//                     ),

//                     filePath: file.path,

//                     language: file.language,

//                     startLine:
//                         file.content
//                             .slice(0, currentStart)
//                             .split("\n").length,

//                     endLine:
//                         file.content
//                             .slice(0, currentEnd)
//                             .split("\n").length,

//                     symbol:
//                         getNodeName(
//                             node,
//                             file.language
//                         ),

//                     type:
//                         getChunkType(
//                             file.language,
//                             node.type
//                         )
//                 });
//             }

//             currentStart = child.startIndex;
//         }

//         currentEnd = child.endIndex;
//     }

//     if (currentStart < currentEnd) {

//         chunks.push({
//             content: file.content.slice(
//                 currentStart,
//                 currentEnd
//             ),

//             filePath: file.path,

//             language: file.language,

//             startLine:
//                 file.content
//                     .slice(0, currentStart)
//                     .split("\n").length,

//             endLine:
//                 file.content
//                     .slice(0, currentEnd)
//                     .split("\n").length,

//             symbol:
//                 getNodeName(
//                     node,
//                     file.language
//                 ),

//             type:
//                 getChunkType(
//                     file.language,
//                     node.type
//                 )
//         });
//     }

//     return chunks;
// }


// function createSizeAwareChunks(
//     file: CodeFile,
//     node: Parser.SyntaxNode
// ): CodeChunk[] {

//     const content =
//         file.content.slice(
//             node.startIndex,
//             node.endIndex
//         );

//     /*
//      * Normal semantic chunk.
//      */
//     if (content.length <= MAX_CHUNK_SIZE) {
//         return [
//             createChunk(file, node)
//         ];
//     }

//     /*
//      * Oversized semantic chunk.
//      */
//     return splitLargeNode(
//         file,
//         node
//     );
// }


// export function chunkCodeFile(
//     file: CodeFile
// ): CodeChunk[] {

//     const parser = new Parser();

//     const grammar = getGrammar(
//         file.language
//     );

//     parser.setLanguage(grammar);

//     const tree = parser.parse(
//         file.content
//     );

//     const nodes = findChunkNodes(
//         tree,
//         file.language
//     );


//     /*
//      * No semantic nodes.
//      */
//     if (nodes.length === 0) {

//         return [
//             {
//                 content: file.content,

//                 filePath: file.path,

//                 language: file.language,

//                 startLine: 1,

//                 endLine:
//                     file.content
//                         .split("\n").length,

//                 symbol: undefined,

//                 type: "file"
//             }
//         ];
//     }


//     /*
//      * Create semantic chunks and
//      * apply size-awareness.
//      */
//     return nodes.flatMap(
//         node =>
//             createSizeAwareChunks(
//                 file,
//                 node
//             )
//     );
// }
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


const MAX_CHUNK_SIZE = 2500;


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

                case "lexical_declaration":
                    return "variable";

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


/*
 * Creates a CodeChunk from an AST node.
 */
function createChunk(
    file: CodeFile,
    node: Parser.SyntaxNode,
    symbol?: string,
    type?: string
): CodeChunk {

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
            symbol ?? getNodeName(
                node,
                file.language
            ),

        type:
            type ?? getChunkType(
                file.language,
                node.type
            )
    };
}


/*
 * Splits an oversized semantic node using
 * its named AST children.
 */
function splitLargeNode(
    file: CodeFile,
    node: Parser.SyntaxNode
): CodeChunk[] {

    const children = node.namedChildren;

    if (children.length === 0) {

        return [
            createChunk(
                file,
                node
            )
        ];
    }

    const chunks: CodeChunk[] = [];

    let currentStart =
        children[0].startIndex;

    let currentEnd =
        children[0].endIndex;

    for (const child of children) {

        const proposedEnd =
            child.endIndex;

        const proposedContent =
            file.content.slice(
                currentStart,
                proposedEnd
            );

        if (
            proposedContent.length >
            MAX_CHUNK_SIZE
        ) {

            if (
                currentStart !==
                child.startIndex
            ) {

                chunks.push({

                    content:
                        file.content.slice(
                            currentStart,
                            currentEnd
                        ),

                    filePath:
                        file.path,

                    language:
                        file.language,

                    startLine:
                        file.content
                            .slice(
                                0,
                                currentStart
                            )
                            .split("\n").length,

                    endLine:
                        file.content
                            .slice(
                                0,
                                currentEnd
                            )
                            .split("\n").length,

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
                });
            }

            currentStart =
                child.startIndex;
        }

        currentEnd =
            child.endIndex;
    }

    if (
        currentStart <
        currentEnd
    ) {

        chunks.push({

            content:
                file.content.slice(
                    currentStart,
                    currentEnd
                ),

            filePath:
                file.path,

            language:
                file.language,

            startLine:
                file.content
                    .slice(
                        0,
                        currentStart
                    )
                    .split("\n").length,

            endLine:
                file.content
                    .slice(
                        0,
                        currentEnd
                    )
                    .split("\n").length,

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
        });
    }

    return chunks;
}


function createSizeAwareChunks(
    file: CodeFile,
    node: Parser.SyntaxNode
): CodeChunk[] {

    const content =
        file.content.slice(
            node.startIndex,
            node.endIndex
        );

    /*
     * Normal semantic chunk.
     */
    if (
        content.length <=
        MAX_CHUNK_SIZE
    ) {

        return [
            createChunk(
                file,
                node
            )
        ];
    }

    /*
     * Oversized semantic chunk.
     */
    return splitLargeNode(
        file,
        node
    );
}


export function chunkCodeFile(
    file: CodeFile
): CodeChunk[] {

    const parser =
        new Parser();

    const grammar =
        getGrammar(
            file.language
        );

    parser.setLanguage(
        grammar
    );

    const tree =
        parser.parse(
            file.content
        );

    const nodes =
        findChunkNodes(
            tree,
            file.language
        );


    /*
     * No semantic nodes.
     */
    if (
        nodes.length === 0
    ) {

        return [

            {
                content:
                    file.content,

                filePath:
                    file.path,

                language:
                    file.language,

                startLine: 1,

                endLine:
                    file.content
                        .split("\n")
                        .length,

                symbol:
                    undefined,

                type:
                    "file"
            }

        ];
    }


    /*
     * Create semantic chunks and
     * apply size-awareness.
     */
    return nodes.flatMap(
        node =>
            createSizeAwareChunks(
                file,
                node
            )
    );
}