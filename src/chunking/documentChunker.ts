import Parser from "tree-sitter";
import JSONGrammar from "tree-sitter-json";

import type {
    CodeFile,
    CodeChunk
} from "../ingestion/types.ts";


function createFileChunk(
    file: CodeFile
): CodeChunk {

    return {
        content: file.content,

        filePath: file.path,

        language: file.language,

        startLine: 1,

        endLine:
            file.content.split("\n").length,

        symbol: undefined,

        type: "file"
    };
}


function getJsonKey(
    pair: Parser.SyntaxNode
): string | undefined {

    const key =
        pair.childForFieldName("key");

    if (!key) {
        return undefined;
    }

    return key.text
        .replace(/^"/, "")
        .replace(/"$/, "");
}


function chunkJSON(
    file: CodeFile
): CodeChunk[] {

    const parser = new Parser();

    parser.setLanguage(JSONGrammar);

    const tree =
        parser.parse(file.content);


    const root =
        tree.rootNode.firstNamedChild;


    if (
        !root ||
        root.type !== "object"
    ) {
        return [
            createFileChunk(file)
        ];
    }


    const chunks: CodeChunk[] = [];


    for (const pair of root.namedChildren) {

        if (pair.type !== "pair") {
            continue;
        }


        const key =
            getJsonKey(pair);

        if (!key) {
            continue;
        }


        chunks.push({

            content:
                file.content.slice(
                    pair.startIndex,
                    pair.endIndex
                ),

            filePath:
                file.path,

            language:
                file.language,

            startLine:
                pair.startPosition.row + 1,

            endLine:
                pair.endPosition.row + 1,

            symbol:
                key,

            type:
                "json_section"
        });
    }


    if (chunks.length === 0) {

        return [
            createFileChunk(file)
        ];
    }


    return chunks;
}


export function chunkDocument(
    file: CodeFile
): CodeChunk[] {

    switch (file.language) {

        case "json":
            return chunkJSON(file);

        default:
            return [
                createFileChunk(file)
            ];
    }
}
export function chunkMarkdown(
    file: CodeFile
): CodeChunk[] {

    const lines = file.content.split("\n");

    const TARGET_SIZE = 1500;
    const MAX_SIZE = 2500;

    const chunks: CodeChunk[] = [];

    let headingStack: string[] = [];

    let currentBlocks: {
        startLine: number;
        endLine: number;
        content: string;
    }[] = [];

    let currentBlock: string[] = [];
    let currentBlockStart = 0;

    let inCodeBlock = false;


    function getHeadingPath(): string {
        return headingStack.join(" > ");
    }


    function flushBlock(endLine: number) {

        if (currentBlock.length === 0) {
            return;
        }

        const content = currentBlock.join("\n").trim();

        if (!content) {
            currentBlock = [];
            return;
        }

        currentBlocks.push({
            startLine: currentBlockStart + 1,
            endLine,
            content
        });

        currentBlock = [];
    }


    function flushBlocks() {

        if (currentBlocks.length === 0) {
            return;
        }

        const headingPath = getHeadingPath();

        let accumulated = "";
        let chunkStartLine = currentBlocks[0].startLine;
        let chunkEndLine = currentBlocks[0].endLine;


        for (const block of currentBlocks) {

            const candidate =
                accumulated.length === 0
                    ? block.content
                    : `${accumulated}\n\n${block.content}`;


            /*
             * Keep adding blocks while staying around
             * the target size.
             */
            if (
                accumulated.length === 0 ||
                candidate.length <= TARGET_SIZE
            ) {
                accumulated = candidate;
                chunkEndLine = block.endLine;
                continue;
            }


            /*
             * The candidate would exceed the target.
             *
             * If the accumulated content is already
             * large enough, emit it.
             */
            chunks.push({
                content: headingPath
                    ? `[Section: ${headingPath}]\n\n${accumulated}`
                    : accumulated,

                filePath: file.path,
                language: file.language,
                startLine: chunkStartLine,
                endLine: chunkEndLine,
                symbol: headingPath || undefined,
                type: "markdown_section"
            });


            accumulated = block.content;
            chunkStartLine = block.startLine;
            chunkEndLine = block.endLine;
        }


        if (accumulated) {

            chunks.push({
                content: headingPath
                    ? `[Section: ${headingPath}]\n\n${accumulated}`
                    : accumulated,

                filePath: file.path,
                language: file.language,
                startLine: chunkStartLine,
                endLine: chunkEndLine,
                symbol: headingPath || undefined,
                type: "markdown_section"
            });
        }


        currentBlocks = [];
    }


    function handleHeading(
        level: number,
        title: string,
        lineIndex: number
    ) {

        /*
         * Finish content belonging to the previous section.
         */
        flushBlock(lineIndex);

        flushBlocks();


        /*
         * Maintain heading hierarchy.
         *
         * Example:
         *
         * # Installation
         * ## Configuration
         * ### Environment
         *
         * becomes:
         *
         * ["Installation",
         *  "Configuration",
         *  "Environment"]
         */
        headingStack = headingStack.slice(0, level - 1);

        headingStack.push(title.trim());


        /*
         * The heading itself becomes the beginning
         * of the next logical block.
         *
         * We don't need to duplicate the actual heading
         * in every chunk because [Section: ...] provides
         * the hierarchy as embedding context.
         */
        currentBlock = [];
        currentBlockStart = lineIndex + 1;
    }


    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];


        /*
         * Detect fenced code blocks.
         *
         * We intentionally do NOT process headings or
         * blank lines inside a fenced code block.
         */
        if (/^\s*```/.test(line)) {

            if (!inCodeBlock) {

                /*
                 * Start of fenced code block.
                 */
                if (currentBlock.length === 0) {
                    currentBlockStart = i;
                }

                currentBlock.push(line);
                inCodeBlock = true;

            } else {

                /*
                 * End of fenced code block.
                 */
                currentBlock.push(line);
                inCodeBlock = false;
            }

            continue;
        }


        /*
         * Everything inside a fenced code block stays
         * untouched.
         */
        if (inCodeBlock) {

            currentBlock.push(line);

            continue;
        }


        /*
         * Heading detection.
         */
        const headingMatch =
            /^(#{1,6})\s+(.+?)\s*$/.exec(line);

        if (headingMatch) {

            const level = headingMatch[1].length;
            const title = headingMatch[2];

            handleHeading(
                level,
                title,
                i
            );

            continue;
        }


        /*
         * Blank line = logical block boundary.
         *
         * This naturally groups:
         *
         * paragraphs
         * lists
         * tables
         * blockquotes
         * etc.
         */
        if (line.trim() === "") {

            if (currentBlock.length > 0) {

                flushBlock(i);

                /*
                 * We don't immediately flush currentBlocks.
                 * Multiple small blocks can still be combined
                 * into one ~1500 character chunk.
                 */
            }

            continue;
        }


        /*
         * Normal Markdown content.
         */
        if (currentBlock.length === 0) {
            currentBlockStart = i;
        }

        currentBlock.push(line);
    }


    /*
     * Flush anything remaining at EOF.
     */
    flushBlock(lines.length);
    flushBlocks();


    /*
     * Empty Markdown file.
     */
    if (chunks.length === 0) {
        return [
            createFileChunk(file)
        ];
    }


    return chunks;
}