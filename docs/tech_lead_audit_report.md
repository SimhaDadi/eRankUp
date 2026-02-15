# Tech Lead Audit Report: Stability Issue in /explanations

## Problem Statement
The `/explanations` list is experiencing a persistent 500 Internal Server Error, especially when filtering by `examId`.

## Audit Findings
1. **Query Complexity**: The previous optimization correctly reduced redundant joins, but the logic still relies on multiple ManyToMany paths (exams, models, modelExams) using `OR` conditions. This creates a "result set explosion" before the pagination limit is applied.
2. **TypeORM Pagination (Paging Bug)**: Using `take()` (limit) alongside a complex `leftJoinAndSelect` with a custom `ON` clause condition (`contextExamId IS NULL`) is a known edge case in TypeORM that often produces invalid SQL in Postgres.
3. **Implicit Ambiguity**: The `OR` conditions across four different tables can cause rows to be duplicated and then filtered by `take()`, which is inefficient and unstable in production under high load or with large datasets.

## Resolution Plan (Hardening)
1. **Eliminate Join Pollution**: Use `EXISTS` subqueries for filtering by `examId` and `modelId`. This ensures the main query result set never explodes, regardless of how many exams or models a question belongs to.
2. **Standardize Joins**: Move the `contextExamId IS NULL` condition from the SQL level to the Javascript mapping phase. Joining the explanations table without a conditional `ON` clause ensures TypeORM's pagination logic stays stable.
3. **Mapping Safety**: Harden the data transformation layer with guaranteed null-checks and explicit date serialization.

## Final Verdict
The system requires a structural shift from "Join-based Filtering" to "Subquery-based Filtering" for ManyToMany relationships to achieve production-grade stability.

---
**Lead Engineer Audit Signature**
*Antigravity System Architect*
