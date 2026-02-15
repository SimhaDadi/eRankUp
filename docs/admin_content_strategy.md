# Admin-to-Student Content Pipeline: Best Practice Strategy

To manage AI-generated content flawlessly for 1L+ students, we recommend a **"Staged Fulfillment"** workflow. This ensures that the Admin remains the final authority on quality while the AI handles the bulk "heavy lifting."

## 1. The Content Lifecycle
We suggest adopting the following 4-stage lifecycle for every question:

| Stage | Status | Entity State | Student Visibility |
| :--- | :--- | :--- | :--- |
| **Stage 1** | 📝 Pending | No Explanation Record | NO Solution Shown |
| **Stage 2** | 🤖 Generated | `isVerified = false` | "AI Draft" (Greyed/Hidden) |
| **Stage 3** | ✅ Verified | `isVerified = true` | Solution Visible with AI Badge |
| **Stage 4** | ⭐ Approved | `adminApprovedExplanation != null` | Final Solution (Admin Badge) |

## 2. Recommended Admin Workflow

### Step A: Bulk Generation (Off-Peak)
- Use the **Generate Missing** utility to trigger background processing for entire chapters at once.
- **Why**: This populates your "Staging Area" without delaying your manual review process.

### Step B: The "High-Risk" Priority Audit
- Use the **Logical Mismatch** dashboard to filter questions where the AI disagreed with the answer key.
- **Why**: Focus your limited manual review time on the ~5% of questions that are mathematically complex or contradictory.

### Step C: One-Click Approval
- The current dashboard allows one-click approval. For Stage 4, you can edit the text results directly in the portal before they reach the students.

### Step D: The Final Sync
- Once a batch is reviewed, use the **Sync Utility** to push all `Approved` text back into the core Question table for millisecond-fast retrieval by students during mock tests.

## 3. Student-Facing "Quality Shield"
To prevent student confusion with unreviewed content:
1.  **The "Safety Toggle"**: In the mobile app, add an admin setting: *"Show Unverified AI Explanations"*.
2.  **Explicit Badging**: Always tag solutions as "Verified by Faculty" vs "AI Generated".
3.  **Automatic Flags**: If a student marks a solution as "Not Helpful", it should automatically revert to **Stage 1 (Pending)** in the admin dashboard for re-review.

## 4. Architect's Verdict
By treating AI as your **"Junior Faculty"** (Stage 2) and the Admins as **"Senior Quality Assurance"** (Stage 4), you create a trust-based system that scales to millions of users without sacrificing accuracy.
