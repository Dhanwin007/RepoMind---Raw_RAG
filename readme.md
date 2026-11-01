
# RepoMind – Codebase RAG System

RepoMind is a learning-oriented Codebase Retrieval-Augmented Generation (RAG) system designed to understand software repositories and answer questions about their structure, implementation, dependencies, and behavior.

The project focuses on implementing core RAG concepts, including AST-based code chunking, hybrid retrieval, Reciprocal Rank Fusion (RRF), cross-encoder reranking, and query decomposition.

---

## 1. Architecture

```text
GitHub Repository URL
        |
        v
GitHub API Loader
        |
        v
In-memory Repository Snapshot
        |
        v
Repository Scanner
        |
        v
AST-based Code Chunking
        |
        v
Code Embeddings
        |
        v
ChromaDB
        |
        v
Indexed Code Chunks

User Query
        |
        v
Query Processing
        |
        v
Hybrid Retrieval
       / \
      v   v
 Vector  BM25
 Search  Search
      \   /
       v v
Reciprocal Rank Fusion
        |
        v
Cross-Encoder Reranking
        |
        v
Context Builder
        |
        v
Groq LLM
        |
        v
Answer with Source References
```

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Repository ingestion | GitHub REST API |
| Code parsing | Tree-sitter |
| File discovery | fast-glob |
| Ignore rules | ignore |
| Vector database | ChromaDB |
| Embedding model | Nomic Embed |
| Keyword retrieval | BM25 |
| BM25 implementation | wink-bm25-text-search |
| Retrieval fusion | Reciprocal Rank Fusion |
| Reranker | BGE Reranker v2 M3 |
| Reranker runtime | Hugging Face Transformers.js |
| LLM provider | Groq |
| LLM model | openai/gpt-oss-120b |
| Execution | tsx |

---

## 3. Repository Ingestion

RepoMind uses the GitHub API to retrieve repository contents. It does not clone or maintain a local source-code copy of the repository.

### Ingestion Workflow

1. Accept a public GitHub repository URL.
2. Retrieve repository metadata and its default branch.
3. Retrieve the Git tree recursively.
4. Identify supported source files.
5. Fetch file contents into memory.
6. Apply filtering rules, including `.gitignore` and file-size restrictions.
7. Pass the resulting files to the chunking pipeline.

ChromaDB and the BM25 index are persisted locally. This is separate from storing a local copy of the source repository.

---

## 4. Code Chunking

RepoMind uses Tree-sitter for AST-based, document-aware chunking.

Traditional text-based chunking can split functions, classes, and other logical structures. AST-based chunking helps preserve these structures.

### Chunk Types

- Functions
- Classes
- Methods
- Variables and declarations
- Language-specific code structures
- Document and configuration sections

Specialized chunkers handle formats such as HTML, CSS, JSON, and Markdown.

Each chunk retains metadata such as:

- File path
- Programming language
- Starting line
- Ending line
- Symbol name, when available
- Chunk type

---

## 5. Retrieval Pipeline

RepoMind combines semantic vector retrieval and lexical BM25 retrieval.

### 5.1 Vector Search

Code chunks are embedded and stored in ChromaDB.

Vector search retrieves chunks based on semantic similarity to the user's question.

### 5.2 BM25 Search

BM25 retrieves chunks based on lexical relevance.

It is particularly useful for searching:

- Function names
- Class names
- Variables
- API endpoints
- Identifiers
- Exact technical terminology

The BM25 index is persisted for reuse across executions.

### 5.3 Reciprocal Rank Fusion (RRF)

Vector and BM25 results are combined using Reciprocal Rank Fusion.

Formula:

```text
RRF Score(d) = Σ 1 / (k + rank(d))
```

Where:

- `d` represents a retrieved document.
- `rank(d)` is its position in a retrieval result list.
- `k` is a ranking constant, currently 60.

Current retrieval configuration:

| Stage | Configuration |
|---|---:|
| Vector retrieval | Top 15 |
| BM25 retrieval | Top 15 |
| RRF output | Top 10 |
| Cross-encoder output | Top 5 |

### 5.4 Cross-Encoder Reranking

The BGE Reranker v2 M3 model evaluates the relevance between the user's query and retrieved code chunks.

Unlike embedding similarity, a cross-encoder jointly evaluates the query and candidate document.

The reranker reorders fused results to prioritize the most relevant chunks.

---

## 6. Initial Query Decomposition

RepoMind includes an initial LLM-based query decomposition component using the Groq API.

It identifies focused retrieval queries from broad user questions.

Example:

**Original question:**

"List all the middlewares and their implementation."

Possible retrieval directions:

1. Identify middleware registration points.
2. Locate middleware implementation definitions.
3. Identify the behavior implemented by each middleware.

Generated queries are independently passed through the hybrid retrieval pipeline. Their results are merged before context construction.

### Current Limitations

- Generated queries can be generic or overlapping.
- The original question is retained as a baseline retrieval query.
- The decomposer does not inspect retrieved evidence before generating queries.
- Initial queries are executed independently.
- Retrieval does not automatically adapt to newly discovered symbols, functions, or file references.
- Relevant implementation chunks can remain missing from the final context.

These limitations motivate the next development milestone.

---

## 7. Next Milestone: Evidence-Guided Decomposition

**Status: Planned**

The next objective is to make query decomposition responsive to evidence discovered during retrieval.

Instead of generating all retrieval queries upfront, RepoMind will use an evidence-guided retrieval approach.

### Proposed Workflow

```text
Original User Question
        |
        v
Initial Retrieval
        |
        v
Retrieve Relevant Chunks
        |
        v
Evidence Extraction
        |
        v
Identify Missing Information
        |
        v
Generate Targeted Follow-up Queries
        |
        v
Second Retrieval Pass
        |
        v
Merge and Deduplicate Evidence
        |
        v
Context Builder
        |
        v
Groq LLM
        |
        v
Final Answer
```

### Example

Consider the question:

"List all the middlewares and their implementation."

Initial retrieval might identify registrations in `src/server.ts`:

```typescript
app.use(rateLimiter);
app.use(requestLogger);
app.use(errorHandler());
```

From this retrieved evidence, RepoMind can identify three middleware symbols:

- `rateLimiter`
- `requestLogger`
- `errorHandler`

It can then generate targeted follow-up queries to retrieve their actual implementations.

This approach aims to solve the gap between finding where a component is used and finding how that component is implemented.

### Planned Implementation Steps

1. Extract useful symbols and file references from initial retrieval results.
2. Identify which parts of the original question remain unanswered.
3. Generate evidence-based follow-up queries.
4. Run targeted hybrid retrieval for those queries.
5. Merge and deduplicate retrieved chunks.
6. Build a more complete context for answer generation.
7. Introduce a bounded retrieval loop to prevent unnecessary iterations.

The first implementation will use one bounded follow-up retrieval pass rather than an unrestricted agent loop.

---

## 8. Development Status

| Component | Status |
|---|---|
| GitHub API repository ingestion | Implemented |
| In-memory repository scanning | Implemented |
| AST-based code chunking | Implemented |
| Embedding generation | Implemented |
| ChromaDB integration | Implemented |
| BM25 indexing and persistence | Implemented |
| Hybrid retrieval | Implemented |
| Reciprocal Rank Fusion | Implemented |
| Cross-encoder reranking | Implemented |
| Context construction | Implemented |
| Groq answer generation | Implemented |
| Initial query decomposition | Implemented |
| Evidence-guided decomposition | Next milestone |
| Iterative retrieval optimization | Planned |

---

## 9. Project Objective

RepoMind is primarily a learning-oriented engineering project.

Its development focuses on understanding:

- How source code can be represented for retrieval.
- Why AST-based chunking is useful for code repositories.
- How semantic and lexical retrieval complement each other.
- How ranking algorithms improve retrieval quality.
- Why retrieved context determines answer quality.
- How query decomposition improves broad-question retrieval.
- How evidence-guided retrieval makes a RAG pipeline adaptive.

The long-term objective is to develop a reliable codebase RAG system that can retrieve relevant implementation details across an entire software repository and generate answers grounded in actual source code.

---

**Current Focus:** Implementing evidence-guided decomposition and improving retrieval completeness for broad repository questions.
