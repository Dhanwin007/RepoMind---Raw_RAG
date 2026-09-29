declare module "wink-bm25-text-search" {

    interface BM25Engine {

        defineConfig(config: {
            fldWeights: Record<string, number>;

            bm25Params?: {
                k1?: number;
                b?: number;
                k?: number;
            };

            ovFldNames?: string[];
        }): void;

        definePrepTasks(
            tasks: Array<(text: string) => string[]>,
            field?: string
        ): number;

        addDoc(
            doc: Record<string, string>,
            uniqueId: string | number
        ): void;

        consolidate(
            fp?: number
        ): void;

        search(
            text: string,
            limit?: number
        ): Array<[string | number, number]>;

        exportJSON(): string;

        importJSON(json: string): void;

        getDocs(): unknown;

        getTokens(): unknown;

        getIDF(): unknown;

        getConfig(): unknown;

        getTotalCorpusLength(): number;

        getTotalDocs(): number;

        reset(): void;
    }

    function bm25(): BM25Engine;

    export = bm25;
}