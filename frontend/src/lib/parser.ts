import Tesseract from 'tesseract.js';

// Initialize PDF.js worker dynamically to prevent load-time crashes
const initPdfWorker = async () => {
    if (typeof window === 'undefined') return null;

    // Dynamically import to avoid top-level failures
    const pdfjsLib = await import('pdfjs-dist');

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    return pdfjsLib;
};

interface ParsedQuestion {
    content: string;
    options: { id: string; text: string }[];
    correctOptionId?: string;
    explanation?: string;
    topic?: string;
}

export const parseFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
        return parsePDF(file);
    } else if (file.type.startsWith('image/')) {
        return parseImage(file);
    } else if (file.type === 'text/plain') {
        return await file.text();
    }
    throw new Error('Unsupported file type');
};

const parsePDF = async (file: File): Promise<string> => {
    const pdfjsLib = await initPdfWorker();
    if (!pdfjsLib) throw new Error("PDF Worker failed to initialize");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
};

const parseImage = async (file: File): Promise<string> => {
    const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => console.log(m), // Optional: logging progress
    });
    return result.data.text;
};

// Heuristic Parser
export const parseQuestionsFromText = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];

    // Normalize newlines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    let currentQuestion: ParsedQuestion | null = null;
    let currentOptionId: string | null = null;

    // Regex patterns
    const questionStartRegex = /^(?:Q\.?|Question|Problem)\s?(\d+)[:.]|^\d+\.\s/i;
    const optionStartRegex = /^\(?([a-d])\)[:.]|^\s*([A-D])\.\s/i;
    const answerRegex = /^(?:Ans|Answer|Correct Option)[:.]?\s*\(?([a-d])\)?/i;

    // Iterate through lines to build questions
    // Note: This is a basic state machine parser

    lines.forEach((line) => {
        // Check for new Question
        const qMatch = line.match(questionStartRegex);
        if (qMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            // Start new question
            currentQuestion = {
                content: line.replace(questionStartRegex, '').trim(),
                options: [],
                topic: 'General'
            };
            currentOptionId = null;
            return;
        }

        // Check for Option
        const optMatch = line.match(optionStartRegex);
        if (optMatch && currentQuestion) {
            const optLabel = (optMatch[1] || optMatch[2]).toLowerCase();
            const optText = line.replace(optionStartRegex, '').trim();
            currentQuestion.options.push({ id: optLabel, text: optText });
            return;
        }

        // Check for Answer
        const ansMatch = line.match(answerRegex);
        if (ansMatch && currentQuestion) {
            const ansLabel = ansMatch[1].toLowerCase();
            currentQuestion.correctOptionId = ansLabel;
            return;
        }

        // Append content to current question if no other match
        if (currentQuestion) {
            // If we already have options, this might be explanation or next option part
            if (currentQuestion.options.length > 0) {
                // For now, treat as explanation if it's after options
                if (!currentQuestion.explanation) currentQuestion.explanation = '';
                currentQuestion.explanation += line + ' ';
            } else {
                // Append to question body
                currentQuestion.content += ' ' + line;
            }
        }
    });

    // Push last question
    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    // Post-processing to fill gaps
    return questions.map(q => {
        // Ensure 4 options if fewer
        if (q.options.length < 4) {
            const labels = ['a', 'b', 'c', 'd'];
            labels.forEach(l => {
                if (!q.options.find(o => o.id === l)) {
                    q.options.push({ id: l, text: 'Option ' + l.toUpperCase() });
                }
            });
        }
        // Ensure correct option
        if (!q.correctOptionId) q.correctOptionId = 'a';
        return q;
    });
};
