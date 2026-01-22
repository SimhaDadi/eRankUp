# CSV Bulk Upload Template

## Required Columns

When uploading questions via CSV, the following columns are **required**:

### Hierarchy Columns (Required)
- `examId` - UUID of the exam (e.g., `123e4567-e89b-12d3-a456-426614174000`)
- `subjectId` - UUID of the subject (e.g., `223e4567-e89b-12d3-a456-426614174001`)
- `chapterId` - UUID of the chapter (e.g., `323e4567-e89b-12d3-a456-426614174002`)

### Question Content (Required)
- `content` or `questiontext` - The question text
- `optiona` or `option1` - First option
- `optionb` or `option2` - Second option
- `optionc` or `option3` - Third option
- `optiond` or `option4` - Fourth option
- `correctoption` or `correctanswer` - Correct answer (A, B, C, or D)
- `topic` - Topic name (e.g., "Algebra", "Grammar")

### Optional Columns
- `explanation` - Explanation for the correct answer
- `positivemarks` - Marks for correct answer (default: 1.0)
- `negativemarks` - Marks deducted for wrong answer (default: 0.25)
- `difficulty` - Difficulty level: `easy`, `medium`, or `hard` (default: medium)

---

## CSV Template Example

```csv
examId,subjectId,chapterId,content,optiona,optionb,optionc,optiond,correctoption,topic,explanation,positivemarks,negativemarks,difficulty
123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174001,323e4567-e89b-12d3-a456-426614174002,"What is 2+2?",3,4,5,6,B,Basic Arithmetic,"2+2 equals 4",1.0,0.25,easy
123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174001,323e4567-e89b-12d3-a456-426614174002,"What is the capital of France?",London,Paris,Berlin,Madrid,B,Geography,"Paris is the capital of France",1.0,0.25,medium
```

---

## How to Get Hierarchy IDs

1. **Navigate to Content Hierarchy** in the admin panel
2. **Select your Exam** - Copy the exam ID from the URL or details
3. **Select your Subject** - Copy the subject ID
4. **Select your Chapter** - Copy the chapter ID
5. **Use these IDs** in your CSV file

---

## Important Notes

⚠️ **All hierarchy IDs must be valid UUIDs** that exist in your database
⚠️ **Questions without valid hierarchy links will be rejected**
⚠️ **Use quotes around question text** if it contains commas
⚠️ **Correct option must be A, B, C, or D** (case-insensitive)

---

## Error Handling

If any row fails validation, it will be skipped and reported in the errors array. The upload will continue processing valid rows.

Common errors:
- `Missing hierarchy IDs` - examId, subjectId, or chapterId is missing
- `Invalid hierarchy IDs` - The IDs don't match existing records
- `Mismatch column count` - Row has wrong number of columns
