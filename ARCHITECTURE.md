# eRankUp Internal Architecture

## 1. System Overview
eRankUp is a high-performance exam preparation platform built on a **NestJS (Backend)** and **React/Next.js (Frontend)** stack. The system is designed for modularity, specifically in its AI capabilities, allowing for interchangeable model providers to optimize for cost, speed, and reliability.

---

## 2. AI Layer Architecture (Crucial)

The core innovation in eRankUp's backend is the **Provider-Agnostic AI Service**. The system is NOT tied to a single AI provider, ensuring resilience and performance.

### 2.1. The `AIService` Abstraction
All AI operations are routed through `src/ai/ai.service.ts`. This service acts as a switch, routing requests based on the `AI_PROVIDER` environment variable.

- **Primary Router**: `AIService` checks `process.env.AI_PROVIDER`.
- **Default Provider**: `gemini` (Google Gemini 1.5 Flash).
- **High-Speed Provider**: `groq` (Llama 3.2 via Groq Cloud).

### 2.2. Feature Support Matrix
Not all providers support all features. The system handles this by hybridizing calls where necessary.

| Feature | Function Name | Supported Providers | Notes |
| :--- | :--- | :--- | :--- |
| **Solution Generation** | `generateText` | ✅ Gemini, ✅ Groq | Used for "Explain this Question". |
| **AI Chat / Tutor** | `generateStream` | ✅ Gemini, ✅ Groq | "Tutor" mode. Groq is significantly faster. |
| **Doubt Solver** | `photoSearch` | ✅ Gemini, ✅ Groq | Vision capabilities. Groq Llama 3.2 Vision is supported. |
| **Document Parsing** | `parseDocument` | ✅ Gemini, ✅ Groq | PDF/Image to Question conversion. |
| **Embeddings** | `generateEmbedding` | ⚠️ **Gemini ONLY** | Used for "Similar Questions" search. |

> **⚠️ Architectural Constraints**:
> The `generateEmbedding` function relies on Gemini's `text-embedding-004` model. Even if `AI_PROVIDER=groq` is set, the system will **silently use Gemini** for embeddings to ensure vector search features (finding similar questions) continue to work.

### 2.3. Configuration
To switch providers, update `backend/.env`:

```env
# Option 1: Default (All Gemini)
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...

# Option 2: Hybrid (High Speed)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy... (Still required for Embeddings!)
```

---

## 3. Core Services

### 3.1. Explanation Service (`ExplanationService`)
- Responsible for generating static solutions for questions.
- **Dependency**: Strictly relies on `AIService`. Does NOT instantiate AI clients directly.
- **Workflow**: Check DB Cache -> If Miss -> Call `AIService.generateText` -> Save to DB -> Return.

### 3.2. AI Chat Service (`AIChatService`)
- Manages stateful conversations (Tutor Mode).
- **Streaming**: Utilizes `AIService.generateStream` for real-time typewriter effects.
- **Persistence**: Chat history is stored in Postgres (`ChatConversation`, `ChatMessage` tables).

---

## 4. Data Layer
- **Database**: PostgreSQL with `pgvector` (implied for embeddings).
- **ORM**: TypeORM.
- **Entities**: 
    - `Question`: Stores content, options, and vector embeddings.
    - `QuestionExplanation`: Stores approved/AI-generated solutions.

