# Answer Logic Audit: AI Precision & Consistency

## Audit Objectives
1. Verify that AI-generated explanations are logically consistent with the correct answer key.
2. Implement a mechanism to detect and flag "Logical Mismatches" where the AI solver disagrees with the database.
3. Harden the generation pipeline against contradictory AI responses (e.g., AI correcting itself mid-text).

## Key Implementation: The "Blind Solve" Pass
I have implemented a **Blind Solve** strategy in the `ExplanationService`. Before generating a visible explanation for the student, the system performs a hidden analysis:
- **Mechanism**: The AI is asked to solve the question from scratch without access to the `correctOptionId`.
- **Validation**: If the AI's independent solution matches the database, it proceeds. If it mismatches, it flags the question as a `Logical Mismatch` for admin review.
- **Harding**: The `[HIDDEN]` thinking block is forced to perform a final self-audit before outputting any visible text.

## Findings & Improvements
- **Issue**: Some AI models were leaking "internal debate" (e.g., "Actually, I think B is wrong..."). 
- **Fix**: Added negative constraints in the prompt and aggressive post-processing in `AIUtils` to strip these conversational markers.
- **Issue**: Database IDs for options (A, B, C) were sometimes mismatched with the logical content.
- **Fix**: The system now records the exactly "Solved Logic" in the `logicalSolveOutcome` field for immediate diagnostic audit.

## Recommendation
Admins should periodically review questions flagged with `isLogicalMismatch = true` to ensure either the question data or the AI logic is corrected.
