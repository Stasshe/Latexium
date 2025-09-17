# Latexium

A powerful TypeScript library for parsing and analyzing LaTeX mathematical expressions.

## Features

- **LaTeX Parsing**: Convert LaTeX math expressions into Abstract Syntax Trees (AST)
- **Mathematical Analysis**: Evaluate, differentiate, integrate, and solve equations
- **Scope Resolution**: Proper handling of bound variables in integrals and summations
- **High Precision**: Support for exact symbolic computation and high-precision numerical results
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install latexium
```

## Quick Start

```typescript
import { parseLatex, analyze } from 'latexium';

// Parse a LaTeX expression
const parseResult = parseLatex("x^2 + \\sin(x)");
if (parseResult.error) {
  console.error(parseResult.error);
  return;
}

// Evaluate with a specific value
const result = analyze(parseResult.ast, {
  task: "evaluate",
  values: { x: Math.PI / 2 }
});

console.log(result.value); // "3.141592653589793"
```

## API Reference

### `parseLatex(expression: string): ParseResult`

Parses a LaTeX mathematical expression into an AST.

### `analyze(ast: ASTNode, options: AnalyzeOptions): AnalyzeResult`

Performs mathematical analysis on an AST with various tasks:

- `evaluate`: Calculate numerical value
- `differentiate`: Compute derivative
- `integrate`: Compute integral
- `solve`: Solve equations
- `min`/`max`: Find extrema

## Examples

### Differentiation

```typescript
const parseResult = parseLatex("x^3 + 2x^2 + x");
const derivative = analyze(parseResult.ast, { 
  task: "differentiate", 
  variable: "x" 
});
console.log(derivative.value); // "3x^2 + 4x + 1"
```

### Integration

```typescript
const parseResult = parseLatex("\\int_0^1 x^2 \\, dx");
const integral = analyze(parseResult.ast, { task: "evaluate" });
console.log(integral.value); // "\\frac{1}{3}"
```

### Solving Equations

```typescript
const parseResult = parseLatex("x^2 - 4 = 0");
const solution = analyze(parseResult.ast, { 
  task: "solve", 
  solveFor: "x" 
});
console.log(solution.value); // "x \\in \\{-2, 2\\}"
```

## License

MIT

## Contributing

Please read our [SPECIFICATION.md](./SPECIFICATION.md) for detailed API specifications and development guidelines.