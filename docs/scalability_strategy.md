# eRankUp: Architectural Scalability Strategy

## The Challenge
As we scale from hundreds to thousands of exams and millions of questions/attempts, traditional "Join-Heavy" relational patterns (like the one currently causing the 500 error) will become the primary bottleneck.

## Current Bottleneck: "The Cartesian Explosion"
The system currently tries to assemble a "Question View" by joining Subjects, Exams, Models, and Explanations simultaneously. In SQL, this creates a massive internal matrix that grows exponentially:
`O(Questions * Exams * Models * Chapters)`

## Architectural Solution: The Scalability Roadmap

### 1. Near Term: "Subquery over Join" (Hardening)
**Action**: Move Many-to-Many filtering into `EXISTS` subqueries.
**Benefit**: The database can check for a relationship without merging the tables. This makes queries linear and predictable, even with 100x more data.

### 2. Mid Term: Denormalization & Read-Models
**Action**: Instead of joining `Subject` every time to get the title, we "denormalize" the `subjectTitle` directly into the `Question` table during ingestion.
**Benefit**: Reading a question becomes a single-table lookup (extremely fast).

### 3. Long Term: CQRS (Command Query Responsibility Segregation)
**Action**: Split the database into two sides:
- **Write Side (PostgreSQL)**: Optimized for consistency (inserting questions, saving attempts).
- **Read Side (Elasticsearch/Typesense)**: Optimized for the Dashboard. All searching and filtering (Exams, Chapters, Search text) happens here in milliseconds.

### 4. Implementation Priority for Current Session
We will implement **Near-Term Hardening** (Subqueries) immediately to resolve the 500 error and provide a stable foundation for the next 10x growth phase.

---
**Architect's Verdict**
The current failures are "growing pains" indicating that we have outgrown generic QueryBuilder patterns. Moving to subqueries is the professional bridge to a high-scale architecture.
