# Re-attempt Logic Comparison: Web vs Mobile

## Current State Analysis

### Mobile (Updated)
- **Mode Toggle**: Global toggle at the bottom of the Solution Explorer.
- **Initial State**: When `reAttemptMode` is **ON**, all explanations are **HIDDEN** by default.
- **Interaction**:
  1. User identifies a question.
  2. User picks an option.
  3. UI shows Correct/Incorrect feedback for that specific pick.
  4. **Explanation remains hidden** until the user explicitly clicks a "View Solution & Analysis" button.
- **Visuals**: Uses teal colors to indicate active re-attempt mode. Shows a "Your original answer" badge if applicable.

### Web (Current)
- **Mode Toggle**: Button in the bottom footer.
- **Initial State**: When `reAttemptMode` is **ON**, the "View Solution" button is still visible and functional at the bottom.
- **Interaction**:
  1. User picks an option.
  2. **Logic Check**: `handleReAttemptSelect` currently has a comment `// Auto-show solution once user makes a re-attempt selection`, but it sets `setShowSolution(false)` (Wait, let me re-check this line).
  3. The `View Solution` button is outside the question/options logic.
- **Discrepancy**: The web application currently allows toggling the solution independently of the re-attempt state, and it might not be hiding it strictly enough by default when entering the mode.

## Proposed Alignment for Web

To match the mobile app's new "Premium" behavior:
1. **Implicit Hide**: When `reAttemptMode` is toggled **ON**, `showSolution` must be set to `false`.
2. **Persistence**: The solution should stay hidden even after picking an option (unlike the current web comment suggesting auto-show).
3. **Triggered Reveal**: The user must explicitly click "View Solution" to see the explanation.
4. **Visual Sync**: Ensure the "View Solution" button looks consistent and clear that it's the intended way to see the answer.

## Verification Plan
1. Toggle Re-attempt mode on Web.
2. Confirm "View Solution" is hidden/reset.
3. Pick an option.
4. Confirm explanation **stays hidden**.
5. Click "View Solution" and confirm it reveals.
