
# Latexium

<p align="center">
  <img src="./readme-assets/card.jpeg" alt="Latexium Logo" width="320"/>
</p>
Latexium is a TypeScript library for parsing and analyzing LaTeX mathematical expressions.



**Note:**
- Features such as factorial simplification (e.g. `!` reduction), advanced integration, definite integrals, `\lim` (limit), and advanced differentiation are **not supported** yet and are under development.
- The main features currently implemented and tested are:
  - **Distribution** (`distribute` task)
  - **Factorization** (`factor` task, using LLL and Berlekamp-Zassenhaus algorithms)
  - **Evaluation** (`evaluate` task)
  - **Step-by-step process output** (`steps` field in results, useful for debugging and understanding the calculation process)
- For details and actual supported cases, see the test cases in `tests/master.test.mjs`.

## Example: Step-by-step Output (Raw)

Below is a real output example of the `steps` field from `analyzeResult.json` (fold to view):


<h3 style="margin-top:1.5em; font-size:1.25em;">Step-by-step Output Example</h3>
<details>
<summary><span style="font-size:1.15em; font-weight:bold; color:#1976d2;">📝 Click to expand steps (from <code>analyzeResult.json</code>)</span></summary>

```json
{
  "steps": [
    "Original expression: x^{3} + 2x^{2} - 3x",
    "--- overlapSimplify start ---",
    [
      "overlapSimplify pass #1",
      "Starting unified simplification",
      [
        "After middle-simplify",
        [
          "Converted sqrt to exponential form: x^{3} + 2x^{2} - 3x",
          "Applied advanced exponential simplification: x^{3} + 2x^{2} - 3x",
          "Applying basic simplification",
          "x^{3} + 2x^{2} - 3x",
          "Finished basic simplification: x^{3} + 2x^{2} - 3x"
        ]
      ],
      "Applying advanced factorization",
      [
        "Advanced factorization applied",
        [
          "Factorization attempt #1",
          "Starting factorization of: x^{3} + 2x^{2} - 3x",
          "Analyzing 3 terms for common factors",
          "Numeric GCD: 1",
          "Common variable factors: x",
          "Factored form: common factor times remaining expression",
          "rightFactored",
          [
            "Starting factorization of: x^{2} + 2x - 3",
            "PatternRecognitionStrategy: Applied pattern 'quadratic-factorization'.",
            "\u2713 Applied pattern-recognition: (x - 1)(x + 3)",
            "No further factorization possible",
            "Attempting recursive factorization of subexpressions...",
            "leftFactored",
            [
              "Starting factorization of: x - 1",
              "No further factorization possible",
              "Attempting recursive factorization of subexpressions..."
            ],
            "[recursive-factor] factored left: x - 1",
            "rightFactored",
            [
              "Starting factorization of: x + 3",
              "No further factorization possible",
              "Attempting recursive factorization of subexpressions..."
            ],
            "[recursive-factor] factored right: x + 3"
          ],
          "[recursive-factor] factored right: (x - 1)(x + 3)"
        ]
      ],
      [
        "Final pass with expand: false",
        "x(x - 1)(x + 3)"
      ],
      [
        "Unified simplification complete",
        [
          "Converted sqrt to exponential form: x(x - 1)(x + 3)",
          "Applied advanced exponential simplification: x(x - 1)(x + 3)",
          "Applying basic simplification",
          "x(x - 1)(x + 3)",
          "Finished basic simplification: x(x - 1)(x + 3)"
        ]
      ]
    ],
    "No further change detected, stopping.",
    "--- overlapSimplify end ---",
    "Final factored form: x(x - 1)(x + 3)"
  ],
  "value": "x(x - 1)(x + 3)",
  ...other fields...
```

</details>


---



## Features

- LaTeX parsing: Convert LaTeX math expressions into Abstract Syntax Trees (AST)
- Mathematical analysis: **Distribute**, **factor**, and **evaluate** expressions (other tasks are under development)
- Step-by-step output: Each analysis result includes a `steps` array showing the calculation process
- Type safety: Full TypeScript support with comprehensive type definitions



## Installation

```bash
npm install latexium
```




## Quick Start

```typescript
import { parseLatex, analyze } from 'latexium';

const parseResult = parseLatex("(x+1)(x+2)");
const distributed = analyze(parseResult.ast, { task: "distribute" });
console.log(distributed.value); // "x^2 + 3x + 2"
console.log(distributed.steps);
// [
//   "Expand: (x+1)(x+2)",
//   "Step 1: x*(x+2) = x^2 + 2x",
//   "Step 2: 1*(x+2) = x + 2",
//   "Combine: x^2 + 2x + x + 2 = x^2 + 3x + 2"
// ]

const factored = analyze(parseResult.ast, { task: "factor" });
console.log(factored.value); // "(x+1)(x+2)"
console.log(factored.steps);
// [
//   "Factor: x^2 + 3x + 2",
//   "Find roots: x^2 + 3x + 2 = 0 → x = -1, -2",
//   "Write as (x+1)(x+2)"
// ]
```




## API Reference

### `parseLatex(expression: string): ParseResult`
Parses a LaTeX mathematical expression into an AST.

### `analyze(ast: ASTNode, options: AnalyzeOptions): AnalyzeResult`
Performs mathematical analysis on an AST. Currently supported tasks:

- `distribute`: Expand products and powers
- `factor`: Factor polynomials (LLL, Berlekamp-Zassenhaus, etc.)
- `evaluate`: Calculate numerical value (basic support)

Other tasks (differentiate, integrate, solve, min/max, etc.) are not yet fully supported.




## Examples

See `tests/master.test.mjs` for comprehensive and up-to-date test cases, including many edge cases for `distribute`, `factor`, and `evaluate`.

### Distribution

```typescript
const parseResult = parseLatex("(x+1)(x+2)");
const result = analyze(parseResult.ast, { task: "distribute" });
console.log(result.value); // "x^2 + 3x + 2"
console.log(result.steps);
// [
//   "Expand: (x+1)(x+2)",
//   "Step 1: x*(x+2) = x^2 + 2x",
//   "Step 2: 1*(x+2) = x + 2",
//   "Combine: x^2 + 2x + x + 2 = x^2 + 3x + 2"
// ]
```

### Factorization

```typescript
// Simple factorization
const parseResult1 = parseLatex("x^2 + 3x + 2");
const result1 = analyze(parseResult1.ast, { task: "factor" });
console.log(result1.value); // "(x+1)(x+2)"
console.log(result1.steps);
// [
//   "Factor: x^2 + 3x + 2",
//   "Find roots: x^2 + 3x + 2 = 0 → x = -1, -2",
//   "Write as (x+1)(x+2)"
// ]

// More difficult factorization
const parseResult2 = parseLatex("x^4 - 16");
const result2 = analyze(parseResult2.ast, { task: "factor" });
console.log(result2.value); // "(x^2 + 4)(x + 2)(x - 2)"
console.log(result2.steps);
// [
//   "Factor: x^4 - 16",
//   "Step 1: x^4 - 16 = (x^2 - 4)(x^2 + 4)",
//   "Step 2: x^2 - 4 = (x - 2)(x + 2)",
//   "Combine: (x^2 + 4)(x + 2)(x - 2)"
// ]
```

### Evaluation

```typescript
const parseResult = parseLatex("2^3 + 1");
const result = analyze(parseResult.ast, { task: "evaluate" });
console.log(result.value); // "9"
console.log(result.steps);
// [
//   "Evaluate: 2^3 = 8",
//   "Add: 8 + 1 = 9"
// ]
```




## License

MIT




## Contributing

Please read [SPECIFICATION.md](./SPECIFICATION.md) for detailed API specifications and development guidelines.