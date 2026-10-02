// import type Parser from "tree-sitter";


// const CHUNK_NODE_TYPES: Record<string, Set<string>> = {

//     javascript: new Set([
//         "function_declaration",
//         "function",
//         "class_declaration",
//         "method_definition",
//         "arrow_function"
//     ]),

//     typescript: new Set([
//         "function_declaration",
//         "function",
//         "class_declaration",
//         "method_definition",
//         "arrow_function",
//         "interface_declaration",
//         "type_alias_declaration",
//         "enum_declaration"
//     ]),

//     python: new Set([
//         "function_definition",
//         "class_definition"
//     ]),

//     java: new Set([
//         "class_declaration",
//         "method_declaration",
//         "constructor_declaration",
//         "interface_declaration",
//         "enum_declaration"
//     ]),

//     c: new Set([
//         "function_definition",
//         "struct_specifier"
//     ]),

//     cpp: new Set([
//         "class_specifier",
//         "function_definition",
//         "struct_specifier"
//     ]),

//     go: new Set([
//         "function_declaration",
//         "method_declaration",
//         "type_declaration"
//     ])
// };


// export function walkTree(
//     node: Parser.SyntaxNode,
//     visitor: (node: Parser.SyntaxNode) => void
// ): void {

//     visitor(node);

//     for (const child of node.children) {

//         walkTree(
//             child,
//             visitor
//         );
//     }
// }


// export function findChunkNodes(
//     tree: Parser.Tree,
//     language: string
// ): Parser.SyntaxNode[] {

//     const nodeTypes =
//         CHUNK_NODE_TYPES[language];

//     if (!nodeTypes) {
//         return [];
//     }

//     const nodes: Parser.SyntaxNode[] = [];

//     walkTree(
//         tree.rootNode,
//         (node) => {

//             if (nodeTypes.has(node.type)) {
//                 nodes.push(node);
//             }
//         }
//     );

//     return nodes;
// }


// export function getNodeName(
//     node: Parser.SyntaxNode,
//     language: string
// ): string | undefined {

//     // First try the standard "name" field.
//     const nameNode =
//         node.childForFieldName("name");

//     if (nameNode) {
//         return nameNode.text;
//     }


//     switch (language) {

//         case "c":
//         case "cpp": {

//             const declarator =
//                 node.childForFieldName(
//                     "declarator"
//                 );

//             if (declarator) {

//                 const name =
//                     findIdentifier(declarator);

//                 if (name) {
//                     return name;
//                 }
//             }

//             break;
//         }


//         case "go": {

//             if (node.type === "type_declaration") {

//                 const typeSpec =
//                     node.namedChildren.find(
//                         child =>
//                             child.type === "type_spec"
//                     );

//                 if (typeSpec) {

//                     const identifier =
//                         typeSpec.namedChildren.find(
//                             child =>
//                                 child.type === "type_identifier"
//                         );

//                     return identifier?.text;
//                 }
//             }

//             break;
//         }
//     }


//     return undefined;
// }


// function findIdentifier(
//     node: Parser.SyntaxNode
// ): string | undefined {

//     if (
//         node.type === "identifier" ||
//         node.type === "field_identifier" ||
//         node.type === "type_identifier"
//     ) {
//         return node.text;
//     }


//     for (const child of node.namedChildren) {

//         const result =
//             findIdentifier(child);

//         if (result) {
//             return result;
//         }
//     }


//     return undefined;
// }
import type Parser from "tree-sitter";


const CHUNK_NODE_TYPES: Record<string, Set<string>> = {

    javascript: new Set([
        "function_declaration",
        "function",
        "class_declaration",
        "method_definition",
        "arrow_function"
    ]),

    typescript: new Set([
        "function_declaration",
        "function",
        "class_declaration",
        "method_definition",
        "arrow_function",
        "interface_declaration",
        "type_alias_declaration",
        "enum_declaration"
    ]),

    python: new Set([
        "function_definition",
        "class_definition"
    ]),

    java: new Set([
        "class_declaration",
        "method_declaration",
        "constructor_declaration",
        "interface_declaration",
        "enum_declaration"
    ]),

    c: new Set([
        "function_definition",
        "struct_specifier"
    ]),

    cpp: new Set([
        "class_specifier",
        "function_definition",
        "struct_specifier"
    ]),

    go: new Set([
        "function_declaration",
        "method_declaration",
        "type_declaration"
    ])
};


export function walkTree(
    node: Parser.SyntaxNode,
    visitor: (node: Parser.SyntaxNode) => void
): void {

    visitor(node);

    for (const child of node.children) {

        walkTree(
            child,
            visitor
        );
    }
}


/*
 * Finds the lexical declaration that contains
 * a function or arrow function.
 *
 * Example:
 *
 * const addRequestId = () => {};
 *
 * arrow_function
 *      ↓
 * variable_declarator
 *      ↓
 * lexical_declaration
 *
 *
 * Also handles nested functions:
 *
 * const httpLogger = pinoHttp({
 *     genReqId: (req) => {},
 *     customLogLevel: (req, res) => {}
 * });
 *
 * genReqId arrow
 *      ↓
 * object pair
 *      ↓
 * object
 *      ↓
 * call_expression
 *      ↓
 * variable_declarator
 *      ↓
 * lexical_declaration
 *
 * Result:
 *
 * const httpLogger = pinoHttp({...});
 *
 * becomes the chunk instead of the individual callbacks.
 */
function findEnclosingVariableDeclaration(
    node: Parser.SyntaxNode
): Parser.SyntaxNode | undefined {

    let current = node.parent;

    while (current) {

        if (
            current.type ===
            "variable_declarator"
        ) {

            const declaration =
                current.parent;

            if (
                declaration?.type ===
                "lexical_declaration"
            ) {
                return declaration;
            }
        }

        current = current.parent;
    }

    return undefined;
}


/*
 * Adds a node to the result only once.
 *
 * Multiple nested callbacks can belong
 * to the same lexical declaration.
 *
 * Example:
 *
 * httpLogger
 * ├── genReqId
 * ├── customLogLevel
 * ├── customSuccessMessage
 * ├── customErrorMessage
 * └── serializers.req
 *
 * All of them resolve to the same
 * lexical_declaration.
 */
function addUniqueNode(
    nodes: Parser.SyntaxNode[],
    seen: Set<number>,
    node: Parser.SyntaxNode
): void {

    if (seen.has(node.startIndex)) {
        return;
    }

    seen.add(node.startIndex);
    nodes.push(node);
}


export function findChunkNodes(
    tree: Parser.Tree,
    language: string
): Parser.SyntaxNode[] {

    const nodeTypes =
        CHUNK_NODE_TYPES[language];

    if (!nodeTypes) {
        return [];
    }

    const nodes: Parser.SyntaxNode[] = [];

    const seen = new Set<number>();

    walkTree(
        tree.rootNode,
        (node) => {

            if (!nodeTypes.has(node.type)) {
                return;
            }


            /*
             * Functions and arrow functions that are
             * part of a variable declaration should
             * use the complete variable declaration
             * as their semantic boundary.
             *
             * This handles:
             *
             * const foo = () => {};
             *
             * and also nested cases such as:
             *
             * const httpLogger = pinoHttp({
             *     genReqId: () => {},
             *     customLogLevel: () => {}
             * });
             *
             * and:
             *
             * const captureResponseBody = () => {
             *     res.send = function () {};
             * };
             */
            if (
                node.type === "arrow_function" ||
                node.type === "function"
            ) {

                const declaration =
                    findEnclosingVariableDeclaration(
                        node
                    );

                if (declaration) {

                    addUniqueNode(
                        nodes,
                        seen,
                        declaration
                    );

                    return;
                }
            }


            /*
             * Normal semantic nodes:
             *
             * function_declaration
             * class_declaration
             * method_definition
             * interface_declaration
             * type_alias_declaration
             * enum_declaration
             * etc.
             */
            addUniqueNode(
                nodes,
                seen,
                node
            );
        }
    );

    return nodes;
}


export function getNodeName(
    node: Parser.SyntaxNode,
    language: string
): string | undefined {

    /*
     * Variable declarations.
     *
     * Example:
     *
     * const httpLogger = pinoHttp(...);
     *
     * The name belongs to the
     * variable_declarator.
     */
    if (
        node.type ===
        "lexical_declaration"
    ) {

        const declarator =
            node.namedChildren.find(
                child =>
                    child.type ===
                    "variable_declarator"
            );

        if (declarator) {

            const name =
                declarator.childForFieldName(
                    "name"
                );

            if (name) {
                return name.text;
            }
        }
    }


    /*
     * Standard Tree-sitter "name" field.
     *
     * Used by:
     *
     * function_declaration
     * class_declaration
     * method_definition
     * interface_declaration
     * etc.
     */
    const nameNode =
        node.childForFieldName("name");

    if (nameNode) {
        return nameNode.text;
    }


    switch (language) {

        case "c":
        case "cpp": {

            const declarator =
                node.childForFieldName(
                    "declarator"
                );

            if (declarator) {

                const name =
                    findIdentifier(
                        declarator
                    );

                if (name) {
                    return name;
                }
            }

            break;
        }


        case "go": {

            if (
                node.type ===
                "type_declaration"
            ) {

                const typeSpec =
                    node.namedChildren.find(
                        child =>
                            child.type ===
                            "type_spec"
                    );

                if (typeSpec) {

                    const identifier =
                        typeSpec.namedChildren.find(
                            child =>
                                child.type ===
                                "type_identifier"
                        );

                    return identifier?.text;
                }
            }

            break;
        }
    }


    return undefined;
}


function findIdentifier(
    node: Parser.SyntaxNode
): string | undefined {

    if (
        node.type === "identifier" ||
        node.type === "field_identifier" ||
        node.type === "type_identifier"
    ) {
        return node.text;
    }


    for (const child of node.namedChildren) {

        const result =
            findIdentifier(child);

        if (result) {
            return result;
        }
    }


    return undefined;
}