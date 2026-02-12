const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../ai/explanation.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the line with FORBID ALGEBRA and replace it with the enhanced version
const lines = content.split('\n');
let updated = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('**FORBID ALGEBRA**')) {
        console.log(`Found FORBID ALGEBRA at line ${i + 1}`);

        // Replace this line and add the new content
        lines[i] = `   5. **STRICTLY FORBIDDEN - NO ALGEBRA**:
     ❌ NEVER write: "Let x be...", "Assume...", "$x = \\\\sqrt{(x+8)(x+18)}$", "$\\\\frac{1}{x} = \\\\frac{1}{a} + \\\\frac{1}{b}$"
     ❌ NEVER use variables in formulas. Use DIRECT NUMBERS ONLY.
     ✅ ALWAYS write: "$x = \\\\sqrt{8 \\\\times 18} = 12$ days" (direct calculation with numbers)
     
  ### EXAMPLE (Time & Work):
  ❌ WRONG FORMAT (Algebraic):
  * $x = \\\\sqrt{(x + 8)(x + 18)}$
  * $\\\\frac{1}{x} = \\\\frac{1}{x + 8} + \\\\frac{1}{x + 18}$
  * Solve for x
  
  ✅ CORRECT FORMAT (Direct Shortcut):
  * Pattern: $x = \\\\sqrt{8 \\\\times 18} = \\\\sqrt{144} = 12$ days
  * Task: $\\\\frac{5}{6}$ work $\\\\rightarrow \\\\frac{5}{6} \\\\times 12 = 10$ days
  
  YOU MUST FOLLOW THE ✅ CORRECT FORMAT. The ❌ WRONG FORMAT is ABSOLUTELY FORBIDDEN.\`;`;

        updated = true;
        break;
    }
}

if (updated) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('✅ Successfully updated explanation.service.ts!');
    console.log('📝 Added explicit examples showing correct vs wrong format.');
} else {
    console.log('❌ Could not find FORBID ALGEBRA line.');
}
