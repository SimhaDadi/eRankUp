
/**
 * Formats dense mathematical text by injecting line breaks for better readability.
 * Handles common patterns like step indicators, equations, and sentence boundaries.
 */
export const prettifyMathText = (text: string | null | undefined): string => {
    if (!text) return '';

    let formatted = text;

    // 1. Ensure spacing around '=>' and add newline before it if it starts a major step
    formatted = formatted.replace(/(\S)=>/g, '$1 =>');
    formatted = formatted.replace(/=>(\S)/g, '=> $1');
    formatted = formatted.replace(/\s*=>\s*/g, ' => '); // Standardization

    // 2. Break lines on specific keywords that typically start new steps
    const stepKeywords = [
        'Hence', 'Therefore', 'Thus', 'So,', 'Now,',
        'Step 1:', 'Step 2:', 'Step 3:', 'Step 4:', 'Step 5:',
        'Given:', 'To find:', 'Solution:', 'Proof:'
    ];

    stepKeywords.forEach(keyword => {
        // Regex looks for the keyword preceded by anything except a newline
        const regex = new RegExp(`([^\\n])\\s*(${keyword})`, 'g');
        formatted = formatted.replace(regex, '$1\n\n**$2**');
    });

    // 3. Break lines for Variable Definitions/Equations (e.g., "Q1 =", "Total =")
    // Look for Pattern: [Space] [Capital Letter][alphanumeric]{0,3} [=]
    formatted = formatted.replace(/(\.\s+)([A-Z][a-zA-Z0-9]{0,5}\s*=\s*)/g, '$1\n\n$2');

    // 4. Break lines after sentences that end with period and space, if the next word is Capitalized OR a Number
    // Heuristic: Period, Space, [Capital Letter or Number].
    // We'll replace ". " with ".\n\n"
    // Also handle ")." followed by space and capital/number is common in math (e.g., "(eq 1). Substituting...")

    // Split: "100. 2 = ..." or "100. Q1 = ..."
    // Exclude common decimals like "2.5" by ensuring space exists
    formatted = formatted.replace(/(\.|\))\s+([A-Z0-9])/g, '$1\n\n$2');

    // 5. Special handling for "Dividing terms", "Multiplying by" etc.
    formatted = formatted.replace(/(\.|\))\s+(Dividing|Multiplying|Adding|Subtracting|Substituting|Comparing)/g, '$1\n\n$2');

    // 6. Split major "=>" implications onto new lines if they are long
    // If "=>" is in the middle of a sentence, we might want it on a new line if it denotes a result
    // e.g., "2 = 4x/100 => x = 50" -> keep as one line? 
    // The user example shows: "Dividing by 40: 3 - 3x/100 = 1 + x/100. 2 = 4x/100 => x = 50."
    // Ideally:
    // Dividing by 40: 3 - 3x/100 = 1 + x/100.
    // 2 = 4x/100 => x = 50.

    // My rule #4 above should catch "x/100. 2 =" -> "x/100.\n\n2 =" which fixes the main issue.

    // 7. Ensure "Percentage less =" or similar final answers are on new lines
    formatted = formatted.replace(/\s+(Percentage|Required|Total|Average|Ratio)\s+/g, '\n\n$1 ');

    return formatted;
};
