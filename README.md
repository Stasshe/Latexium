
# Latexium

<p align="center">
  <img src="./readme-assets/card.jpeg" alt="Latexium Logo" width="320"/>
</p>
Latexium is a TypeScript library for parsing and analyzing LaTeX mathematical expressions.

---

**Note:**

- Features such as factorial simplification (e.g. `!` reduction), advanced integration, definite integrals, `\lim` (limit), and advanced differentiation are **not supported** yet and are under development.
- The main features currently implemented and tested are:
  - **Distribution** (`distribute` task)
  - **Factorization** (`factor` task, using LLL and Berlekamp-Zassenhaus algorithms)
  - **Evaluation** (`evaluate` task)
  - **Step-by-step process output** (`steps` field in results, useful for debugging and understanding the calculation process)
- For details and actual supported cases, see the test cases in `tests/master.test.mjs`.

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