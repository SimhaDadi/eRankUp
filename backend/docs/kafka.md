# Kafka Event Schemas

The eRankUp platform uses a decoupled, event-driven architecture for processing heavy analytical tasks and AI insights.

## Topic: `test_submission`

Triggered whenever a student completes a mock exam.

### Message Structure

```json
{
  "attemptId": "UUID",
  "userId": "UUID",
  "modelId": "UUID",
  "score": "float",
  "totalQuestions": "int",
  "correctAnswers": "int",
  "timeTaken": "int (seconds)",
  "accuracy": "float (0-100)",
  "responses": [
    {
      "questionId": "UUID",
      "selectedOptionId": "string",
      "isCorrect": "boolean",
      "timeSpent": "int (seconds)"
    }
  ],
  "submittedAt": "ISO8601 String"
}
```

### Field Descriptions

| Field | Type | Description |
| :--- | :--- | :--- |
| `attemptId` | UUID | Primary identifier for the test attempt. |
| `userId` | UUID | The student who took the test. |
| `modelId` | UUID | The specific test model (paper) being attempted. |
| `score` | float | Final calculated score based on marking scheme. |
| `accuracy` | float | Percentage of correct answers relative to total attempted. |
| `responses` | Array | Granular data for every question answered. |

### Example Payload

```json
{
  "attemptId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "b3d0c135-2946-4030-b15d-ed54e185ad7d",
  "modelId": "f6e4889b-a730-4c52-8bee-29e5ae83f088",
  "score": 145.5,
  "accuracy": 85.0,
  "timeTaken": 3600,
  "submittedAt": "2026-01-21T17:45:00Z"
}
```

## Consumers
- **Analytics Service**: Updates aggregate trends and user performance stats.
- **AI Recommendation Engine**: Generates personalized learning paths based on weaknesses identified in the submission.
