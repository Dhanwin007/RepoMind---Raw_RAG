import TypeScript from "tree-sitter-typescript";
import JavaScript from "tree-sitter-javascript";
import Python from "tree-sitter-python";

import Java from "tree-sitter-java";
import C from "tree-sitter-c";
import Cpp from "tree-sitter-cpp";
import Go from "tree-sitter-go";

import type Parser from "tree-sitter";


type Grammar =
    Parameters<Parser["setLanguage"]>[0];


const GRAMMARS: Record<string, Grammar> = {

    typescript:
        TypeScript.typescript,

    javascript:
        JavaScript,

    python:
        Python,

    java:
        Java,

    c:
        C,

    cpp:
        Cpp,

    go:
        Go
};


export function getGrammar(
    language: string
): Grammar {

    const grammar = GRAMMARS[language];

    if (!grammar) {

        throw new Error(
            `Unsupported language: ${language}`
        );
    }

    return grammar;
}