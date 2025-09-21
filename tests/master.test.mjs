import { parseLatex, analyze } from '../dist/index.esm.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Output utility functions
let logBuffer = '';
const originalConsoleLog = console.log;

function writeToFile(filename, content) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
}

function appendToLog(message) {
  logBuffer += message + '\n';
}

// Override console.log to capture output while still displaying it
console.log = function (...args) {
  const message = args.join(' ');
  originalConsoleLog(...args);
  appendToLog(message);
};

console.log('=== LATEXIUM MASTER TEST SUITE (SPECIFICATION v3) ===\n');

// 30 Complex Test Cases - Focus on distribute, factor with some others
const complexTestCases = [
  // Distribution Tests (10 cases) - Main focus
  {
    id: 0.8,
    expression: '(x-1)(x-1)(x-1) + 1',
    task: 'factor',
    expected: 'x(x^2 - 3x + 3)',
  },
  {
    id: 0.85,
    expression: 'x^20 - 2x^10 + 1',
    task: 'factor',
    expected: '(x^{10} - 1)^2',
  },
  {
    id: 0.9,
    expression: '(x - 1)^3',
    task: 'factor',
    expected: '(x - 1)^3',
  },
  {
    id: 2,
    expression: '(2x + 3y)^3',
    task: 'distribute',
    expected: '8x^3 + 36x^2y + 54xy^2 + 27y^3',
    description: 'Cubic binomial expansion',
  },
  {
    id: 2.5,
    expression: '4(x + 1)(x^2 + x + 1)',
    task: 'distribute',
    expected: '4x^3 + 8x^2 + 8x + 4',
    description: 'Distribution of binomials',
  },
  {
    id: 2.6,
    expression: '\\frac{x^2 + 2x+ 1}{x+1}',
    task: 'distribute',
    expected: 'x+1',
  },
  {
    id: 2.7,
    expression: '(x^2 +3x +2)',
    task: 'factor',
    expected: '(x+1)(x+2)',
  },
  {
    id: 3,
    expression: '\\frac{x^2 + 2x + 1}{x^2 + 3x + 2}',
    task: 'distribute',
    expected: '\\frac{x+1}{x+2}',
    description: 'Distribution in fraction numerator',
  },
  {
    id: 4,
    expression: '(a + b + c)^2',
    task: 'distribute',
    expected: 'a^2 + 2ab + 2ac + b^2 + 2bc + c^2',
    description: 'Trinomial square expansion',
  },
  {
    id: 5,
    expression: '(x^2 + 2x + 1)(x - 3)',
    task: 'distribute',
    expected: 'x^{3} - x^{2} - 5x - 3',
    description: 'Polynomial multiplication',
  },
  {
    id: 6,
    expression: '\\sin(x)(\\cos(x) + \\tan(x))',
    task: 'distribute',
    expected: '\\sin(x)\\cos(x) + \\sin(x)\\tan(x)',
    description: 'Trigonometric function distribution',
  },
  {
    id: 7,
    expression: '(\\sqrt{x} + 1)(\\sqrt{x} - 1)',
    task: 'distribute',
    expected: 'x - 1',
    description: 'Square root difference of squares',
  },
  {
    id: 8,
    expression: '(e^x + 1)^2',
    task: 'distribute',
    expected: 'e^{2x} + 2e^x + 1',
    description: 'Exponential function square',
  },
  {
    id: 9,
    expression: '\\frac{1}{2}(4x + 6y - 8z)',
    task: 'distribute',
    expected: '2x + 3y - 4z',
    description: 'Fraction coefficient distribution',
  },
  {
    id: 10,
    expression: '(x + y)(x - y)(x^2 + xy + y^2)',
    task: 'distribute',
    expected: 'x^4 - x^2y^2 + xy^3 - y^4',
    description: 'Complex multi-factor distribution',
  },

  // Factorization Tests (10 cases) - Main focus
  {
    id: 11,
    expression: 'x^4 - 16',
    task: 'factor',
    expected: '(x^2 + 4)(x + 2)(x - 2)',
    description: 'Fourth power difference factorization',
  },
  {
    id: 11.5,
    expression: 'x^{3} - 1',
    task: 'factor',
    expected: '(x - 1)(x^2 + x + 1)',
    description: 'Difference of cubes',
  },
  {
    id: 12,
    expression: '6x^3 + 9x^2 - 6x',
    task: 'factor',
    expected: '3x(2x^2 + 3x - 2)',
    description: 'Common factor with quadratic',
  },
  {
    id: 13,
    expression: 'x^3 + 8',
    task: 'factor',
    expected: '(x + 2)(x^2 - 2x + 4)',
    description: 'Sum of cubes factorization',
  },
  {
    id: 14,
    expression: 'x^4 + 4x^3 + 6x^2 + 4x + 1',
    task: 'factor',
    expected: '(x + 1)^4',
    description: 'Perfect fourth power',
  },
  {
    id: 15,
    expression: 'x^6 - 1',
    task: 'factor',
    expected: '(x - 1)(x + 1)(x^2 - x + 1)(x^2 + x + 1)',
    description: 'Sixth power minus one',
  },
  {
    id: 16,
    expression: '2x^3 - 16x',
    task: 'factor',
    expected: '2x(x^2 - 8)',
    description: 'Common factor with difference',
  },
  {
    id: 17,
    expression: 'x^4 - 13x^2 + 36',
    task: 'factor',
    expected: '(x - 2)(x + 2)(x - 3)(x + 3)',
    description: 'Quartic as quadratic in x^2',
  },
  {
    id: 18,
    expression: 'x^3 - 3x^2 + 3x - 1',
    task: 'factor',
    expected: '(x - 1)^3',
    description: 'Perfect cube factorization',
  },
  {
    id: 19,
    expression: '4x^4 - 37x^2 + 9',
    task: 'factor',
    expected: '(4x^2 - 1)(x^2 - 9)',
    description: 'Complex quartic factorization',
  },
  {
    id: 20,
    expression: 'x^8 - 256',
    task: 'factor',
    expected: '(x^4 + 16)(x^2 + 4)(x + 2)(x - 2)',
    description: 'Eighth power difference',
  },

  // Mixed Advanced Tests (10 cases) - Limited use of other functions
  {
    id: 21,
    expression: '\\frac{d}{dx}[x^3 \\sin(x)]',
    task: 'differentiate',
    variable: 'x',
    expected: '3x^2\\sin(x) + x^3\\cos(x)',
    description: 'Product rule with polynomial and trig',
  },
  {
    id: 22,
    expression: '\\int x e^{x^2} dx',
    task: 'integrate',
    variable: 'x',
    expected: '\\frac{1}{2}e^{x^2} + C',
    description: 'Substitution integration',
  },
  {
    id: 23,
    expression: 'x^4 - 5x^2 + 4 = 0',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-2, -1, 1, 2\\}',
    description: 'Quartic equation as quadratic',
  },
  {
    id: 24,
    expression: '\\sqrt{x + 4} + \\sqrt{x - 1}',
    task: 'evaluate',
    values: { x: 5 },
    expected: '5',
    description: 'Square root evaluation',
  },
  {
    id: 24.5,
    expression: 'x^3 - 1',
    task: 'factor',
    expected: '(x - 1)(x^2 + x + 1)',
    description: 'Difference of cubes',
  },
  {
    id: 25,
    expression: '\\frac{x^3 - 1}{x - 1}',
    task: 'factor',
    expected: 'x^2 + x + 1',
    description: 'Polynomial long division factoring',
  },
  {
    id: 26,
    expression: '\\sin^2(x) + \\cos^2(x)',
    task: 'evaluate',
    expected: '1',
    description: 'Pythagorean identity',
  },
  {
    id: 27,
    expression: '\\frac{d}{dx}[\\ln(x^2 + 1)]',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{2x}{x^2 + 1}',
    description: 'Chain rule with logarithm',
  },
  {
    id: 28,
    expression: '(x + y + z)^3',
    task: 'distribute',
    expected: 'x^3 + y^3 + z^3 + 3x^2y + 3x^2z + 3xy^2 + 3y^2z + 3xz^2 + 3yz^2 + 6xyz',
    description: 'Trinomial cube expansion',
  },

  // 30 Difficult Factorization Cases (added)
  {
    id: 100,
    expression: 'x^6 - 1',
    task: 'factor',
    expected: '(x^2 - x + 1)(x^2 + x + 1)(x - 1)(x + 1)',
    description: 'Sixth power minus one (full factorization)',
  },
  {
    id: 101,
    expression: 'x^8 - 1',
    task: 'factor',
    expected: '(x^4 + 1)(x^2 + 1)(x - 1)(x + 1)',
    description: 'Eighth power minus one',
  },
  {
    id: 102,
    expression: 'x^6 + 27',
    task: 'factor',
    expected: '(x^2 + 3x + 3)(x^2 - 3x + 3)',
    description: 'Sum of cubes squared',
  },
  {
    id: 103,
    expression: 'x^4 + 4',
    task: 'factor',
    expected: '(x^2 + 2x + 2)(x^2 - 2x + 2)',
    description: 'Quartic sum of squares',
  },
  {
    id: 104,
    expression: 'x^8 + 16',
    task: 'factor',
    expected: '(x^4 + 4x^2 + 8)(x^4 - 4x^2 + 8)',
    description: 'Eighth power plus 16',
  },
  {
    id: 105,
    expression: 'x^6 - 9x^3 + 27',
    task: 'factor',
    expected: '(x^3 - 3)^2',
    description: 'Perfect cube squared',
  },
  {
    id: 106,
    expression: 'x^4 - 10x^2 + 9',
    task: 'factor',
    expected: '(x^2 - 9)(x^2 - 1)',
    description: 'Quartic as product of quadratics',
  },
  {
    id: 107,
    expression: 'x^6 + x^3 - 12',
    task: 'factor',
    expected: '(x^3 + 4)(x^3 - 3)',
    description: 'Cubic substitution',
  },
  {
    id: 108,
    expression: 'x^8 - 81',
    task: 'factor',
    expected: '(x^4 - 9)(x^4 + 9)',
    description: 'Eighth power minus 81',
  },
  {
    id: 109,
    expression: 'x^6 - 5x^3 + 6',
    task: 'factor',
    expected: '(x^3 - 2)(x^3 - 3)',
    description: 'Cubic factors',
  },
  {
    id: 110,
    expression: 'x^8 - 2x^4 + 1',
    task: 'factor',
    expected: '(x^4 - x^2 + 1)^2',
    description: 'Quartic squared',
  },
  {
    id: 111,
    expression: 'x^6 + 8x^3 + 16',
    task: 'factor',
    expected: '(x^3 + 4)^2',
    description: 'Perfect cube plus constant',
  },
  {
    id: 112,
    expression: 'x^8 - 4x^4 + 4',
    task: 'factor',
    expected: '(x^4 - 2x^2 + 2)^2',
    description: 'Quartic squared with constant',
  },
  {
    id: 113,
    expression: 'x^6 - 64',
    task: 'factor',
    expected: '(x^2 - 4)(x^2 + 2x + 4)(x^2 - 2x + 4)',
    description: 'Sixth power minus 64',
  },
  {
    id: 114,
    expression: 'x^8 + 256',
    task: 'factor',
    expected: '(x^4 + 16)^2',
    description: 'Eighth power plus 256',
  },
  {
    id: 115,
    expression: 'x^6 - 27',
    task: 'factor',
    expected: '(x^2 - 3x + 3)(x^2 + 3x + 3)',
    description: 'Sixth power minus 27',
  },
  {
    id: 116,
    expression: 'x^8 - 16x^4 + 64',
    task: 'factor',
    expected: '(x^4 - 8x^2 + 16)(x^4 + 8x^2 + 16)',
    description: 'Quartic in x^4',
  },
  {
    id: 117,
    expression: 'x^6 + 2x^3 + 1',
    task: 'factor',
    expected: '(x^3 + 1)^2',
    description: 'Perfect cube plus one squared',
  },
  {
    id: 118,
    expression: 'x^8 - 6x^4 + 9',
    task: 'factor',
    expected: '(x^4 - 3)^2',
    description: 'Quartic squared minus constant',
  },
  {
    id: 119,
    expression: 'x^6 - 36x^3 + 216',
    task: 'factor',
    expected: '(x^3 - 6)^2',
    description: 'Perfect cube minus constant squared',
  },
  {
    id: 120,
    expression: 'x^8 - 256x^4 + 4096',
    task: 'factor',
    expected: '(x^4 - 32)^2',
    description: 'Quartic squared minus large constant',
  },
  {
    id: 121,
    expression: 'x^6 + 9x^3 + 27',
    task: 'factor',
    expected: '(x^3 + 3)^2',
    description: 'Perfect cube plus constant squared',
  },
  {
    id: 122,
    expression: 'x^8 - 81x^4 + 6561',
    task: 'factor',
    expected: '(x^4 - 81)^2',
    description: 'Quartic squared minus 81',
  },
  {
    id: 123,
    expression: 'x^6 - 12x^3 + 36',
    task: 'factor',
    expected: '(x^3 - 6)^2',
    description: 'Perfect cube minus constant squared',
  },
  {
    id: 124,
    expression: 'x^8 + 8x^4 + 16',
    task: 'factor',
    expected: '(x^4 + 4)^2',
    description: 'Quartic squared plus constant',
  },
  {
    id: 125,
    expression: 'x^6 - 2x^3 + 1',
    task: 'factor',
    expected: '(x^3 - 1)^2',
    description: 'Perfect cube minus one squared',
  },
  {
    id: 126,
    expression: 'x^8 - 4x^4 + 4',
    task: 'factor',
    expected: '(x^4 - 2x^2 + 2)^2',
    description: 'Quartic squared minus constant',
  },
  {
    id: 127,
    expression: 'x^6 + 6x^3 + 9',
    task: 'factor',
    expected: '(x^3 + 3)^2',
    description: 'Perfect cube plus constant squared',
  },
  {
    id: 128,
    expression: 'x^8 - 64',
    task: 'factor',
    expected: '(x^4 - 8)(x^4 + 8)',
    description: 'Eighth power minus 64',
  },
  {
    id: 129,
    expression: 'x^6 - 1',
    task: 'factor',
    expected: '(x^2 - x + 1)(x^2 + x + 1)(x - 1)(x + 1)',
    description: 'Sixth power minus one (repeat for robustness)',
  },
  {
    id: 131,
    expression: 'x^6 + 1',
    task: 'factor',
    expected: '(x^2 + x + 1)(x^2 - x + 1)',
    description: 'Sixth power plus one',
  },
  {
    id: 132,
    expression: 'x^8 - 1',
    task: 'factor',
    expected: '(x^4 + 1)(x^2 + 1)(x - 1)(x + 1)',
    description: 'Eighth power minus one (repeat for robustness)',
  },
  {
    id: 133,
    expression: 'x^6 - 27',
    task: 'factor',
    expected: '(x^2 - 3x + 3)(x^2 + 3x + 3)',
    description: 'Sixth power minus 27 (repeat for robustness)',
  },
  {
    id: 134,
    expression: 'x^8 + 16',
    task: 'factor',
    expected: '(x^4 + 4x^2 + 8)(x^4 - 4x^2 + 8)',
    description: 'Eighth power plus 16 (repeat for robustness)',
  },
  {
    id: 135,
    expression: 'x^6 + 27',
    task: 'factor',
    expected: '(x^2 + 3x + 3)(x^2 - 3x + 3)',
    description: 'Sixth power plus 27',
  },
  {
    id: 136,
    expression: 'x^8 + 1',
    task: 'factor',
    expected: '(x^4 + sqrt{2}x^2 + 1)(x^4 - sqrt{2}x^2 + 1)',
    description: 'Eighth power plus one (repeat for robustness)',
  },
  {
    id: 137,
    expression: 'x^6 + 1',
    task: 'factor',
    expected: '(x^2 + x + 1)(x^2 - x + 1)',
    description: 'Sixth power plus one (repeat for robustness)',
  },
  {
    id: 138,
    expression: 'x^8 - 1',
    task: 'factor',
    expected: '(x^4 + 1)(x^2 + 1)(x - 1)(x + 1)',
    description: 'Eighth power minus one (repeat for robustness)',
  },
  {
    id: 139,
    expression: 'x^6 - 1',
    task: 'factor',
    expected: '(x^2 - x + 1)(x^2 + x + 1)(x - 1)(x + 1)',
    description: 'Sixth power minus one (repeat for robustness)',
  },
  {
    id: 140,
    expression: 'x^8 + 1',
    task: 'factor',
    expected: '(x^4 + sqrt{2}x^2 + 1)(x^4 - sqrt{2}x^2 + 1)',
    description: 'Eighth power plus one (repeat for robustness)',
  },
  {
    id: 30,
    expression: '\\int_0^{\\pi} \\sin^2(x) dx',
    task: 'integrate',
    variable: 'x',
    expected: '\\frac{\\pi}{2}',
    description: 'Definite integral of trigonometric square',
  },
  // Additional Complex Evaluate Cases
  {
    id: 31,
    expression: '\\sqrt{49} + 2^3',
    task: 'evaluate',
    expected: '15',
    description: 'Evaluate with square root and exponent',
  },
  {
    id: 32,
    expression: '\\frac{6!}{3!2!}',
    task: 'evaluate',
    expected: '60',
    description: 'Evaluate factorial division (combinatorics)',
  },
  {
    id: 32.5,
    expression: '\\frac{(x+1)!}{x!}',
    task: 'evaluate',
  },
  {
    id: 33,
    expression: '\\sin(\\frac{\\pi}{2}) + \\cos(0)',
    task: 'evaluate',
    expected: '2',
    description: 'Evaluate trigonometric sum at special angles',
  },
  {
    id: 34,
    expression: 'e^{\\ln(5)} + \\log_{10}(100)',
    task: 'evaluate',
    expected: '7',
    description: 'Evaluate with exponentials and logarithms',
  },
  {
    id: 35,
    expression: '\\sum_{k=1}^4 k^2',
    task: 'evaluate',
    expected: '30',
    description: 'Evaluate finite sum of squares',
  },
  {
    id: 36,
    expression: '\\prod_{i=1}^4 i',
    task: 'evaluate',
    expected: '24',
    description: 'Evaluate finite product (factorial)',
  },
  {
    id: 39,
    expression: '\\frac{1}{2} + \\frac{2}{3}',
    task: 'evaluate',
    expected: '\\frac{7}{6}',
    description: 'Evaluate sum of fractions',
  },
  {
    id: 40,
    expression: '\\sqrt{16} + \\sqrt{9} + \\sqrt{25}',
    task: 'evaluate',
    expected: '12',
    description: 'Evaluate sum of square roots',
  },
];

function normalizeExpression(expr) {
  if (!expr) return '';

  return expr
    .toString()
    .replace(/\s+/g, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\\/g, '')
    .toLowerCase()
    .trim();
}

function checkExpectedValue(actualValue, expectedValue) {
  if (!actualValue || !expectedValue) return false;

  // Helper: parse a sum of monomials into sorted canonical form
  function canonicalize(expr) {
    // Remove whitespace, braces, and backslashes, normalize ^{n} to ^n
    let s = expr
      .toString()
      .replace(/\\/g, '')
      .replace(/\s+/g, '')
      .replace(/\{([^}]*)\}/g, '$1')
      .replace(/\^\{([^}]*)\}/g, '^$1')
      .replace(/\^/g, '^')
      .replace(/([a-zA-Z])([0-9]+)/g, '$1^$2') // x2 -> x^2
      .replace(/([\\+\\-])/g, ' $1')
      .replace(/\*+/g, '')
      .trim();
    // Split into terms
    let terms = s
      .split(/ (?=[+-])/)
      .map(t => t.trim())
      .filter(Boolean);
    // Normalize each term: sort variables in each monomial
    terms = terms.map(term => {
      // Separate coefficient and variables
      let match = term.match(/^([+-]?\d*\.?\d*)?([a-zA-Z][a-zA-Z0-9^]*)*$/);
      if (!match) return term;
      let coeff = match[1] || '';
      let vars = term.replace(/^([+-]?\d*\.?\d*)/, '');
      // Split variables and sort
      let varParts = [];
      let re = /([a-zA-Z]+)(\^(-?\d+))?/g;
      let m;
      while ((m = re.exec(vars)) !== null) {
        varParts.push(m[0]);
      }
      varParts.sort();
      return (coeff ? coeff : term[0] === '-' ? '-' : '') + varParts.join('');
    });
    // Sort all terms lexicographically
    terms.sort((a, b) => {
      // Remove leading + for comparison
      let aa = a.replace(/^\+/, '');
      let bb = b.replace(/^\+/, '');
      return aa.localeCompare(bb);
    });
    return terms.join('+').replace(/\+\\-/g, '-');
  }

  // Direct match (after normalization, ignore all whitespace)
  const normalizedActual = normalizeExpression(actualValue).replace(/\s+/g, '');
  const normalizedExpected = normalizeExpression(expectedValue).replace(/\s+/g, '');
  if (normalizedActual === normalizedExpected) return true;

  // Canonicalize and compare as sum of monomials (ignore whitespace)
  if (
    canonicalize(actualValue).replace(/\s+/g, '') ===
    canonicalize(expectedValue).replace(/\s+/g, '')
  )
    return true;

  // Numerical tolerance check
  const actualNum = parseFloat(actualValue);
  const expectedNum = parseFloat(expectedValue);
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    const tolerance = 1e-6;
    return Math.abs(actualNum - expectedNum) < tolerance;
  }

  // Check for mathematical equivalence patterns (legacy fallback)
  const mathPatterns = [
    [/pi/g, 'π'],
    [/exp/g, 'e^'],
    [/ln/g, 'log'],
  ];
  let modifiedActual = normalizedActual;
  let modifiedExpected = normalizedExpected;
  for (const [pattern, replacement] of mathPatterns) {
    modifiedActual = modifiedActual.replace(pattern, replacement);
    modifiedExpected = modifiedExpected.replace(pattern, replacement);
  }
  return modifiedActual === modifiedExpected;
}

async function runTestCase(testCase) {
  console.log(`Test ${testCase.id}: ${testCase.description}`);
  console.log(`Expression: ${testCase.expression}`);
  console.log(`Task: ${testCase.task}`);
  console.log(`Expected: ${testCase.expected || 'Not specified'}`);

  const testResult = {
    id: testCase.id,
    description: testCase.description,
    expression: testCase.expression,
    task: testCase.task,
    variable: testCase.variable,
    values: testCase.values,
    expected: testCase.expected,
  };

  try {
    // Parse the LaTeX expression
    const parseResult = parseLatex(testCase.expression);

    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      testResult.status = 'parse_error';
      testResult.error = parseResult.error;
      return testResult;
    }

    // Exclude parseResult.ast from output
    /* eslint-disable-next-line no-unused-vars */
    const { ast: _parseAst, ...parseResultNoAst } = parseResult;
    testResult.parseResult = parseResultNoAst;

    // Build options object
    const options = {
      task: testCase.task,
    };

    if (testCase.variable) {
      options.variable = testCase.variable;
    }

    if (testCase.values) {
      options.values = testCase.values;
    }

    // Analyze the expression
    const analyzeResult = analyze(parseResult.ast, options);

    if (analyzeResult.error) {
      console.log(`⚠️  ANALYZE ERROR: ${analyzeResult.error}`);
      testResult.status = 'analyze_error';
      testResult.error = analyzeResult.error;
      // Exclude analyzeResult.ast from output
      /* eslint-disable-next-line no-unused-vars */
      const { ast: _analyzeAst, ...analyzeResultNoAst } = analyzeResult;
      testResult.analyzeResult = analyzeResultNoAst;
      return testResult;
    }

    console.log(`✅ SUCCESS: ${analyzeResult.value}`);
    console.log(`   Type: ${analyzeResult.valueType}`);
    console.log(`   Steps: ${analyzeResult.steps.length} step(s)`);

    // Exclude analyzeResult.ast from output
    /* eslint-disable-next-line no-unused-vars */
    const { ast: _analyzeAst, ...analyzeResultNoAst } = analyzeResult;
    testResult.analyzeResult = analyzeResultNoAst;
    testResult.actualValue = analyzeResult.value;
    testResult.valueType = analyzeResult.valueType;
    testResult.stepsCount = analyzeResult.steps.length;

    // Check expected value match
    if (testCase.expected) {
      const expectedMatch = checkExpectedValue(analyzeResult.value, testCase.expected);
      testResult.expectedMatch = expectedMatch;
      if (expectedMatch) {
        console.log(`✅ EXPECTED VALUE MATCH`);
      } else {
        console.log(`⚠️  EXPECTED VALUE MISMATCH:`);
        console.log(`   Got: "${analyzeResult.value}"`);
        console.log(`   Expected: "${testCase.expected}"`);
      }
    } else {
      testResult.expectedMatch = true;
    }

    // Validate result structure
    const isValidResult = validateResultStructure(analyzeResult);
    testResult.structureValidation = isValidResult;

    if (!isValidResult.valid) {
      console.log(`❌ INVALID RESULT STRUCTURE: ${isValidResult.reason}`);
      testResult.status = 'structure_error';
      testResult.error = isValidResult.reason;
      return testResult;
    }

    testResult.status = 'success';
    return testResult;
  } catch (error) {
    console.log(`💥 RUNTIME ERROR: ${error.message}`);
    testResult.status = 'runtime_error';
    testResult.error = error.message;
    testResult.stackTrace = error.stack;
    return testResult;
  }
}

function validateResultStructure(result) {
  // Check required fields according to SPECIFICATION.md
  if (!('steps' in result) || !Array.isArray(result.steps)) {
    return { valid: false, reason: 'Missing or invalid steps array' };
  }

  if (!('value' in result)) {
    return { valid: false, reason: 'Missing value field' };
  }

  if (
    !('valueType' in result) ||
    !['exact', 'approximate', 'symbolic'].includes(result.valueType)
  ) {
    return { valid: false, reason: 'Missing or invalid valueType' };
  }

  if (!('ast' in result)) {
    return { valid: false, reason: 'Missing ast field' };
  }

  if (!('error' in result)) {
    return { valid: false, reason: 'Missing error field' };
  }

  // If no error, value should not be null
  if (!result.error && result.value === null) {
    return { valid: false, reason: 'Success case should have non-null value' };
  }

  // If error exists, it should be a string
  if (result.error && typeof result.error !== 'string') {
    return { valid: false, reason: 'Error should be string or null' };
  }

  return { valid: true };
}

async function runTestSuite() {
  console.log('🔍 TESTING COMPLEX SCENARIOS FOR LATEXIUM MASTER SUITE');
  console.log('Focus: distribute, factor with selective other operations\n');

  const results = {
    parse_success: 0, // パース成功数
    parse_error: 0,
    analyze_error: 0,
    structure_error: 0,
    runtime_error: 0,
    expected_match: 0, // 正解数
  };

  const detailedResults = [];
  const taskBreakdown = {
    distribute: { total: 0, parse_success: 0, expected_match: 0 },
    factor: { total: 0, parse_success: 0, expected_match: 0 },
    differentiate: { total: 0, parse_success: 0, expected_match: 0 },
    integrate: { total: 0, parse_success: 0, expected_match: 0 },
    solve: { total: 0, parse_success: 0, expected_match: 0 },
    evaluate: { total: 0, parse_success: 0, expected_match: 0 },
  };

  for (let i = 0; i < complexTestCases.length; i++) {
    const testCase = complexTestCases[i];
    const result = await runTestCase(testCase);
    detailedResults.push(result);

    // Update task breakdown
    if (taskBreakdown[testCase.task]) {
      taskBreakdown[testCase.task].total++;
      if (result.status === 'success') {
        taskBreakdown[testCase.task].parse_success++;
        results.parse_success++;
        if (result.expectedMatch !== false) {
          taskBreakdown[testCase.task].expected_match++;
          results.expected_match++;
        }
      } else if (result.status === 'parse_error') {
        results.parse_error++;
      } else if (result.status === 'analyze_error') {
        results.analyze_error++;
      } else if (result.status === 'structure_error') {
        results.structure_error++;
      } else if (result.status === 'runtime_error') {
        results.runtime_error++;
      }
    }

    console.log('');
  }

  console.log('\n=== MASTER TEST SUITE RESULTS ===');
  console.log(
    `✅ Parse Success: ${results.parse_success}/${complexTestCases.length} (${((results.parse_success / complexTestCases.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `🎯 Expected Match: ${results.expected_match}/${complexTestCases.length} (${((results.expected_match / complexTestCases.length) * 100).toFixed(1)}%)`
  );
  console.log(`❌ Parse Errors: ${results.parse_error}`);
  console.log(`⚠️  Analyze Errors: ${results.analyze_error}`);
  console.log(`🔧 Structure Errors: ${results.structure_error}`);
  console.log(`💥 Runtime Errors: ${results.runtime_error}`);

  console.log('\n=== TASK BREAKDOWN ===');
  Object.entries(taskBreakdown).forEach(([task, stats]) => {
    if (stats.total > 0) {
      const parseSuccessRate = ((stats.parse_success / stats.total) * 100).toFixed(1);
      const expectedMatchRate = ((stats.expected_match / stats.total) * 100).toFixed(1);
      console.log(
        `${task}: Parse Success ${stats.parse_success}/${stats.total} (${parseSuccessRate}%), Expected Match ${stats.expected_match}/${stats.total} (${expectedMatchRate}%)`
      );
    }
  });

  return {
    summary: results,
    detailedResults: detailedResults,
    taskBreakdown: taskBreakdown,
    testCount: complexTestCases.length,
    parseSuccessRate: ((results.parse_success / complexTestCases.length) * 100).toFixed(1),
    expectedMatchRate: ((results.expected_match / complexTestCases.length) * 100).toFixed(1),
  };
}

// Main execution
const startTime = new Date();
const testRunData = {
  timestamp: startTime.toISOString(),
  testType: 'Master Test Suite',
  description: 'Complex scenarios focusing on distribute and factor operations',
  specification: 'SPECIFICATION.md v3',
};

console.log('🚀 Starting Master Test Suite execution...\n');

const results = await runTestSuite();

console.log('\n🏆 MASTER TEST SUITE COMPLETED 🏆');

const endTime = new Date();
const duration = (endTime - startTime) / 1000;

testRunData.results = results;
testRunData.endTime = endTime.toISOString();
testRunData.duration = duration;
//testRunData.testCases = complexTestCases;

if (results.successRate > 80) {
  console.log('\n🎉 EXCELLENT: High implementation quality!');
} else if (results.successRate > 60) {
  console.log('\n👍 GOOD: Solid implementation with room for improvement');
} else {
  console.log('\n⚠️  NEEDS WORK: Significant issues detected');
}

console.log(`\n⏱️  Total execution time: ${duration.toFixed(2)}s`);
console.log('🔬 This suite tests complex mathematical operations per SPECIFICATION.md');

// Write output files
writeToFile('master-test-results.json', JSON.stringify(testRunData, null, 2));

const summaryReport = `LATEXIUM MASTER TEST SUITE REPORT
Generated: ${testRunData.timestamp}
Duration: ${duration.toFixed(2)}s
Specification: ${testRunData.specification}

OVERALL RESULTS:
Total Tests: ${results.testCount}
✅ Parse Success: ${results.summary.parse_success} (${results.parseSuccessRate}%)
🎯 Expected Match: ${results.summary.expected_match} (${results.expectedMatchRate}%)
❌ Parse Errors: ${results.summary.parse_error}
⚠️  Analyze Errors: ${results.summary.analyze_error}
🔧 Structure Errors: ${results.summary.structure_error}
💥 Runtime Errors: ${results.summary.runtime_error}

TASK PERFORMANCE:
${Object.entries(results.taskBreakdown)
  .filter(([, stats]) => stats.total > 0)
  .map(
    ([task, stats]) =>
      `${task}: Parse Success ${stats.parse_success}/${stats.total} (${((stats.parse_success / stats.total) * 100).toFixed(1)}%), Expected Match ${stats.expected_match}/${stats.total} (${((stats.expected_match / stats.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

FOCUS AREAS:
- Distribution operations: Primary test focus
- Factorization: Primary test focus  
- Other operations: Limited testing


QUALITY RATING: ${
  results.parseSuccessRate > 80 && results.expectedMatchRate > 80
    ? 'EXCELLENT'
    : results.parseSuccessRate > 60 || results.expectedMatchRate > 60
      ? 'GOOD'
      : 'NEEDS WORK'
}

This test suite validates complex mathematical operations according to SPECIFICATION.md v3.
Primary focus on distribute and factor operations with selective testing of other features.
`;

writeToFile('master-test-summary.txt', summaryReport);
writeToFile('master-test-log.txt', logBuffer);

console.log(`\n📁 Test results saved to tests/output/:`);
console.log(`   - master-test-results.json (detailed JSON data)`);
console.log(`   - master-test-summary.txt (summary report)`);
console.log(`   - master-test-log.txt (full console output)`);

console.log('\n✨ Master Test Suite execution completed successfully!');
