import { parseLatex } from '../dist/index.esm.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const parseResult = parseLatex('\\frac{1}{x^2+1}');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure the output directory exists
const outputDir = join(__dirname, 'output');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Write the parseResult as JSON
const outputPath = join(outputDir, 'parseResult.json');
writeFileSync(outputPath, JSON.stringify(parseResult, null, 2), 'utf-8');
