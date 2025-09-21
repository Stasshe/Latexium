import { parseLatex, analyze } from '../dist/index.esm.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const parseResult = parseLatex('x^{3} + 2x^{2} - 3x');
const result = analyze(parseResult.ast, { task: 'factor'});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure the output directory exists
const outputDir = join(__dirname, 'output');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Write the parseResult as JSON
const outputPath = join(outputDir, 'analyzeResult.json');
writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
