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

    walkTree(
        tree.rootNode,
        (node) => {

            if (nodeTypes.has(node.type)) {
                nodes.push(node);
            }
        }
    );

    return nodes;
}


export function getNodeName(
    node: Parser.SyntaxNode,
    language: string
): string | undefined {

    // First try the standard "name" field.
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
                    findIdentifier(declarator);

                if (name) {
                    return name;
                }
            }

            break;
        }


        case "go": {

            if (node.type === "type_declaration") {

                const typeSpec =
                    node.namedChildren.find(
                        child =>
                            child.type === "type_spec"
                    );

                if (typeSpec) {

                    const identifier =
                        typeSpec.namedChildren.find(
                            child =>
                                child.type === "type_identifier"
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