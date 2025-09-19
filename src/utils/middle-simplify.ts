/**
 * Middle-level Mathematical Simplification System
 * Basic algebraic simplification within expression scope only
 * No factorization dependencies - polynomial simplification only
 */

import { ASTNode, BinaryExpression, UnaryExpression, Fraction, Integral } from '../types';
import { stepsAstToLatex } from './ast';
import { expandExpression } from './distribution';
// Import the legacy factorExpression function
import { applyTrigonometricIdentities } from './identities/trigonometric';
import { AdvancedTermAnalyzer, AdvancedTermCombiner } from './simplify/commutative';
import {
  convertSqrtToExponential,
  enhancedExponentialSimplification,
} from './simplify/exponential';
import {
  gcd as gcd_simplify,
  reduceFraction,
  areEquivalentExpressions,
} from './simplify/simplification';

/**
 * Polynomial simplification options (no factorization)
 */
export interface SimplifyOptions {
  /** Combine like terms (default: true) */
  combineLikeTerms?: boolean;
  /** Expand products and powers (default: false) */
  expand?: boolean;
  /** Simplify fractions using polynomial methods only (default: true) */
  simplifyFractions?: boolean;
  /** Apply algebraic identities (default: true) */
  applyIdentities?: boolean;
  /** Convert sqrt to exponential form (default: true) */
  convertSqrtToExponential?: boolean;
  /** Apply advanced exponential simplification (default: true) */
  advancedExponentialSimplification?: boolean;
  /** Maximum depth for recursive simplification (default: 10) */
  maxDepth?: number;
}

/**
 * Default simplification options - polynomial processing only
 */
const DEFAULT_SIMPLIFY_OPTIONS: Required<SimplifyOptions> = {
  combineLikeTerms: true,
  expand: true, // Enable expansion by default for polynomial handling
  simplifyFractions: true,
  applyIdentities: true,
  convertSqrtToExponential: true, // Convert sqrt to exponential form by default
  advancedExponentialSimplification: true, // Apply advanced exponential simplification
  maxDepth: 10,
};

/**
 * Enhanced simplification function
 * Converts sqrt to exponential form, applies distribution and advanced simplification
 */
export function simplify(node: ASTNode, options: SimplifyOptions = {}, steps?: string[]): ASTNode {
  const opts = { ...DEFAULT_SIMPLIFY_OPTIONS, ...options };

  if (!node) return node;

  try {
    let result = node;

    // Step 1: Convert all sqrt functions to exponential form (x^(1/2)) if enabled
    if (opts.convertSqrtToExponential) {
      const before = result;
      result = convertSqrtToExponential(result);
      if (steps && before !== result)
        steps.push(`Converted sqrt to exponential form: ${stepsAstToLatex(result)}`);
    }

    // Step 2: Apply full exponential simplification if enabled
    if (opts.advancedExponentialSimplification) {
      const before = result;
      result = enhancedExponentialSimplification(result);
      if (steps && before !== result)
        steps.push(`Applied advanced exponential simplification: ${stepsAstToLatex(result)}`);
    }

    // Step 3: Expansion (only if expand: true)
    if (opts.expand) {
      if (needsExpansion(result)) {
        if (steps) steps.push('Detected need for expansion');
        const before = result;
        const expanded = expandExpression(result);
        if (steps && before !== expanded)
          steps.push(`Expanded expression: ${stepsAstToLatex(expanded)}`);
        if (steps) steps.push('Applying basic simplification after expansion');
        const simplified = basicSimplify(expanded, opts, 0);
        if (steps)
          steps.push(
            `Finished basic simplification after expansion: ${stepsAstToLatex(simplified)}`
          );
        return simplified;
      }
    }

    if (steps) steps.push('Applying basic simplification');
    const simplified = basicSimplify(result, opts, 0);
    if (steps) steps.push(`Finished basic simplification: ${stepsAstToLatex(simplified)}`);
    return simplified;
  } catch (error) {
    // Fallback: return original node if simplification fails
    if (steps) steps.push('Simplification failed, returning original node');
    return node;
  }
}

/**
 * Check if an expression needs expansion before simplification
 */
function needsExpansion(node: ASTNode): boolean {
  if (node.type === 'BinaryExpression') {
    if (node.operator === '*') {
      // Check if we're multiplying by a complex expression
      return hasComplexStructure(node.left) || hasComplexStructure(node.right);
    }
    // Recursively check child nodes for multiplication
    return needsExpansion(node.left) || needsExpansion(node.right);
  }

  if (node.type === 'UnaryExpression') {
    // Check if we have -(...complex expression...)
    if (node.operator === '-' && hasComplexStructure(node.operand)) {
      return true;
    }
    return needsExpansion(node.operand);
  }

  return false;
}

/**
 * Check if a node has complex structure that benefits from expansion
 */
function hasComplexStructure(node: ASTNode): boolean {
  if (node.type === 'BinaryExpression') {
    if (node.operator === '+' || node.operator === '-') {
      return true; // Sum/difference expressions
    }
    if (node.operator === '*') {
      // Check for nested multiplication with sums
      return hasComplexStructure(node.left) || hasComplexStructure(node.right);
    }
    // Check for nested expressions
    return hasComplexStructure(node.left) || hasComplexStructure(node.right);
  }

  if (node.type === 'UnaryExpression') {
    // Negative of complex expressions
    return hasComplexStructure(node.operand);
  }

  return false;
}

/**
 * Basic recursive simplification focused on local scope only
 * No distribution or complex expansion - those are handled by distribution.ts
 */
function basicSimplify(node: ASTNode, options: Required<SimplifyOptions>, depth: number): ASTNode {
  // Prevent infinite recursion
  if (depth > options.maxDepth) {
    return node;
  }

  // Apply only basic local simplifications
  const basicSimplified = applyBasicSimplifications(node, options, depth);

  // Skip structural and algebraic simplifications that involve distribution
  // Those are handled by distribution.ts

  // If no change occurred, return the result
  if (areEquivalentExpressions(node, basicSimplified)) {
    return basicSimplified;
  }

  // If changes occurred, apply one more round of basic simplification
  return basicSimplify(basicSimplified, options, depth + 1);
}

/**
 * Apply basic simplifications (constants, identities)
 */
function applyBasicSimplifications(
  node: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // --- Trigonometric identities ---
  if (options.applyIdentities) {
    const trigResult = applyTrigonometricIdentities(node);
    if (trigResult !== node) return trigResult;
  }

  switch (node.type) {
    case 'NumberLiteral':
    case 'Identifier':
      return node;

    case 'UnaryExpression':
      return simplifyUnaryExpression(node, options, depth);

    case 'BinaryExpression':
      return simplifyBinaryExpression(node, options, depth);

    case 'FunctionCall': {
      {
        // スコープエラー回避のためcase全体をブロックで囲む
        // Recursively simplify arguments
        const simplifiedArgs = node.args.map(arg => basicSimplify(arg, options, depth + 1));
        const funcName = node.name;
        // Only single-argument functions for now
        if (simplifiedArgs.length === 1) {
          const arg = simplifiedArgs[0] as ASTNode;
          // Try to evaluate if possible (sin, cos, tan, etc. with numeric/constant/fractional argument)
          let argVal: number | undefined = undefined;
          // Try to extract value for famous angles (π, e, and their rational multiples)
          argVal = extractFamousConstantValue(arg);
          if (argVal !== undefined && typeof argVal === 'number') {
            let result: number | undefined = undefined;
            switch (funcName) {
              case 'sin':
                result = Math.sin(argVal);
                break;
              case 'cos':
                result = Math.cos(argVal);
                break;
              case 'tan':
                result = Math.tan(argVal);
                break;
              case 'log':
              case 'ln':
                result = Math.log(argVal);
                break;
              case 'exp':
                result = Math.exp(argVal);
                break;
              case 'sqrt':
                result = Math.sqrt(argVal);
                break;
              case 'abs':
                result = Math.abs(argVal);
                break;
              // 他の関数も必要に応じて追加
            }
            if (result !== undefined && isFinite(result)) {
              // 0, -0, 1, -1, 0.0 などは丸める
              if (Math.abs(result) < 1e-14) result = 0;
              if (Math.abs(result - 1) < 1e-14) result = 1;
              if (Math.abs(result + 1) < 1e-14) result = -1;
              return { type: 'NumberLiteral', value: result };
            }
          }
        }
        // Otherwise, return simplified FunctionCall
        return {
          ...node,
          args: simplifiedArgs,
        };
        // --- famous constant extraction helper ---
        function extractFamousConstantValue(node: ASTNode): number | undefined {
          // NumberLiteral
          if (node.type === 'NumberLiteral') return node.value;
          // π, pi, e
          if (node.type === 'Identifier') {
            if (node.name === 'π' || node.name === 'pi') return Math.PI;
            if (node.name === 'e') return Math.E;
          }
          // Fraction: k * π / n, k * e / n, π / n, e / n, ...
          if (node.type === 'Fraction') {
            // numerator, denominator
            const num = extractFamousConstantValue(node.numerator);
            const den = extractFamousConstantValue(node.denominator);
            if (num !== undefined && den !== undefined && den !== 0) {
              return num / den;
            }
          }
          // k * π, k * e, ...
          if (node.type === 'BinaryExpression') {
            const left = node.left,
              right = node.right;
            if (node.operator === '*') {
              const lval = extractFamousConstantValue(left);
              const rval = extractFamousConstantValue(right);
              if (lval !== undefined && rval !== undefined) {
                return lval * rval;
              }
            } else if (node.operator === '/') {
              const lval = extractFamousConstantValue(left);
              const rval = extractFamousConstantValue(right);
              if (lval !== undefined && rval !== undefined && rval !== 0) {
                return lval / rval;
              }
            } else if (node.operator === '+') {
              const lval = extractFamousConstantValue(left);
              const rval = extractFamousConstantValue(right);
              if (lval !== undefined && rval !== undefined) {
                return lval + rval;
              }
            } else if (node.operator === '-') {
              const lval = extractFamousConstantValue(left);
              const rval = extractFamousConstantValue(right);
              if (lval !== undefined && rval !== undefined) {
                return lval - rval;
              }
            }
          }
          // UnaryExpression
          if (node.type === 'UnaryExpression') {
            const val = extractFamousConstantValue(node.operand);
            if (val !== undefined) {
              if (node.operator === '-') return -val;
              if (node.operator === '+') return val;
            }
          }
          return undefined;
        }
      }
    }

    case 'Fraction':
      return simplifyFraction(node, options, depth);

    case 'Integral': {
      const result: Integral = {
        ...node,
        integrand: basicSimplify(node.integrand, options, depth + 1),
      };
      if (node.lowerBound) {
        result.lowerBound = basicSimplify(node.lowerBound, options, depth + 1);
      }
      if (node.upperBound) {
        result.upperBound = basicSimplify(node.upperBound, options, depth + 1);
      }
      return result;
    }

    case 'Sum':
    case 'Product':
      return {
        ...node,
        expression: basicSimplify(node.expression, options, depth + 1),
        lowerBound: basicSimplify(node.lowerBound, options, depth + 1),
        upperBound: basicSimplify(node.upperBound, options, depth + 1),
      };

    default:
      return node;
  }
}

// Add missing function declarations for subtraction and multiplication
function simplifySubtraction(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // x - 0 = x
  if (right.type === 'NumberLiteral' && right.value === 0) return left;
  // 0 - x = -x
  if (left.type === 'NumberLiteral' && left.value === 0) {
    return { type: 'UnaryExpression', operator: '-', operand: right };
  }
  // Number - Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value - right.value };
  }
  // x - x = 0
  if (areEquivalentExpressions(left, right)) {
    return { type: 'NumberLiteral', value: 0 };
  }
  // a - b = a + (-b)
  const negativeRight: ASTNode = {
    type: 'UnaryExpression',
    operator: '-',
    operand: right,
  };
  return simplifyAddition(left, negativeRight, options, depth);
}

function simplifyMultiplication(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // x * 0 = 0
  if (
    (left.type === 'NumberLiteral' && left.value === 0) ||
    (right.type === 'NumberLiteral' && right.value === 0)
  ) {
    return { type: 'NumberLiteral', value: 0 };
  }
  // x * 1 = x
  if (left.type === 'NumberLiteral' && left.value === 1) return right;
  if (right.type === 'NumberLiteral' && right.value === 1) return left;

  // x * (-1) = -x
  if (
    right.type === 'UnaryExpression' &&
    right.operator === '-' &&
    right.operand.type === 'NumberLiteral' &&
    right.operand.value === 1
  ) {
    return { type: 'UnaryExpression', operator: '-', operand: left };
  }
  if (
    left.type === 'UnaryExpression' &&
    left.operator === '-' &&
    left.operand.type === 'NumberLiteral' &&
    left.operand.value === 1
  ) {
    return { type: 'UnaryExpression', operator: '-', operand: right };
  }

  // Number * Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value * right.value };
  }

  // Fraction * Fraction: (a/b) * (c/d) = (ac)/(bd)
  if (left.type === 'Fraction' && right.type === 'Fraction') {
    const newNumerator = simplifyMultiplication(
      left.numerator,
      right.numerator,
      options,
      depth + 1
    );
    const newDenominator = simplifyMultiplication(
      left.denominator,
      right.denominator,
      options,
      depth + 1
    );
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: newNumerator,
        denominator: newDenominator,
      },
      options,
      depth + 1
    );
  }

  // Number * Fraction: n * (a/b) = (n*a)/b
  if (left.type === 'NumberLiteral' && right.type === 'Fraction') {
    const newNumerator = simplifyMultiplication(left, right.numerator, options, depth + 1);
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: newNumerator,
        denominator: right.denominator,
      },
      options,
      depth + 1
    );
  }

  // Fraction * Number: (a/b) * n = (a*n)/b
  if (left.type === 'Fraction' && right.type === 'NumberLiteral') {
    const newNumerator = simplifyMultiplication(left.numerator, right, options, depth + 1);
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: newNumerator,
        denominator: left.denominator,
      },
      options,
      depth + 1
    );
  }

  // Handle negative multiplications: A * (-B) = -(A * B)
  if (right.type === 'UnaryExpression' && right.operator === '-') {
    const positiveResult = simplifyMultiplication(left, right.operand, options, depth + 1);
    return { type: 'UnaryExpression', operator: '-', operand: positiveResult };
  }

  // Handle negative multiplications: (-A) * B = -(A * B)
  if (left.type === 'UnaryExpression' && left.operator === '-') {
    const positiveResult = simplifyMultiplication(left.operand, right, options, depth + 1);
    return { type: 'UnaryExpression', operator: '-', operand: positiveResult };
  }

  // Handle negative multiplications: (-A) * (-B) = A * B
  if (
    left.type === 'UnaryExpression' &&
    left.operator === '-' &&
    right.type === 'UnaryExpression' &&
    right.operator === '-'
  ) {
    return simplifyMultiplication(left.operand, right.operand, options, depth + 1);
  }

  // Handle negative numbers: x * (-2) = -2x
  if (left.type === 'NumberLiteral' && left.value < 0) {
    return {
      type: 'UnaryExpression',
      operator: '-',
      operand: simplifyMultiplication(
        { type: 'NumberLiteral', value: -left.value },
        right,
        options,
        depth + 1
      ),
    };
  }
  if (right.type === 'NumberLiteral' && right.value < 0) {
    return {
      type: 'UnaryExpression',
      operator: '-',
      operand: simplifyMultiplication(
        left,
        { type: 'NumberLiteral', value: -right.value },
        options,
        depth + 1
      ),
    };
  }

  // Advanced term analysis (optional, fallback)
  if (options.combineLikeTerms) {
    const analyzed = AdvancedTermAnalyzer.analyze({
      type: 'BinaryExpression',
      operator: '*',
      left,
      right,
    });
    if (analyzed.coefficient !== 1 || analyzed.variables.size > 0) {
      const reconstructed = AdvancedTermCombiner['reconstructTerm'](analyzed, analyzed.coefficient);
      if (reconstructed) {
        return reconstructed;
      }
    }
  }

  // Try exponential term combination for expressions like x^a * x^b
  if (options.advancedExponentialSimplification) {
    const multiplicationNode = {
      type: 'BinaryExpression' as const,
      operator: '*' as const,
      left,
      right,
    };
    const exponentialCombined = enhancedExponentialSimplification(multiplicationNode);
    if (!areEquivalentExpressions(multiplicationNode, exponentialCombined)) {
      return exponentialCombined;
    }
  }

  return { type: 'BinaryExpression', operator: '*', left, right };
}
/**
 * Simplify unary expressions
 */
function simplifyUnaryExpression(
  node: UnaryExpression,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  const operand = basicSimplify(node.operand, options, depth + 1);

  // Double negation: --x = x
  if (node.operator === '-' && operand.type === 'UnaryExpression' && operand.operator === '-') {
    return operand.operand;
  }

  // Negative number: -5 = -5 (combine into NumberLiteral)
  if (node.operator === '-' && operand.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: -operand.value };
  }

  // Positive unary: +x = x
  if (node.operator === '+') {
    return operand;
  }

  // Apply distributive law for negative over addition/subtraction: -(a + b) = -a - b, -(a - b) = -a + b
  if (node.operator === '-' && operand.type === 'BinaryExpression') {
    const binaryOperand = operand as BinaryExpression;

    // Use a more comprehensive approach to distribute the negative sign
    // Extract all terms from the expression and negate them
    const terms = extractAdditionTerms(binaryOperand);
    const negatedTerms = terms.map(({ term, sign }) => ({ term, sign: -sign }));
    const result = buildAdditionFromTerms(negatedTerms);
    return basicSimplify(result, options, depth + 1);
  }

  return { ...node, operand };
}

/**
 * Simplify binary expressions with comprehensive pattern matching
 */
function simplifyBinaryExpression(
  node: BinaryExpression,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  const left = basicSimplify(node.left, options, depth + 1);
  const right = basicSimplify(node.right, options, depth + 1);

  // Apply operator-specific simplifications
  switch (node.operator) {
    case '+':
      return simplifyAddition(left, right, options, depth);
    case '-':
      return simplifySubtraction(left, right, options, depth);
    case '*':
      return simplifyMultiplication(left, right, options, depth);
    case '/':
      return simplifyDivision(left, right, options, depth);
    case '^':
      return simplifyPower(left, right, options, depth);
    default:
      return { type: 'BinaryExpression', operator: node.operator, left, right };
  }
}

/**
 * Simplify addition with like terms combination
 */
function simplifyAddition(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // 0 + x = x
  if (left.type === 'NumberLiteral' && left.value === 0) return right;
  if (right.type === 'NumberLiteral' && right.value === 0) return left;

  // Number + Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value + right.value };
  }

  // Fraction + Fraction (通分して加算)
  if (left.type === 'Fraction' && right.type === 'Fraction') {
    // 通分: a/b + c/d = (ad + cb) / bd
    const lnum = left.numerator,
      lden = left.denominator;
    const rnum = right.numerator,
      rden = right.denominator;
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: simplifyAddition(
          simplifyMultiplication(lnum, rden, options, depth + 1),
          simplifyMultiplication(rnum, lden, options, depth + 1),
          options,
          depth + 1
        ),
        denominator: simplifyMultiplication(lden, rden, options, depth + 1),
      },
      options,
      depth + 1
    );
  }
  // Fraction + NumberLiteral
  if (left.type === 'Fraction' && right.type === 'NumberLiteral') {
    // a/b + c = (a + bc)/b
    const lnum = left.numerator,
      lden = left.denominator;
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: simplifyAddition(
          lnum,
          simplifyMultiplication(right, lden, options, depth + 1),
          options,
          depth + 1
        ),
        denominator: lden,
      },
      options,
      depth + 1
    );
  }
  if (left.type === 'NumberLiteral' && right.type === 'Fraction') {
    // c + a/b = (a + bc)/b
    return simplifyAddition(right, left, options, depth);
  }

  // Like terms combination
  if (options.combineLikeTerms) {
    const terms = extractAdditionTerms({ type: 'BinaryExpression', operator: '+', left, right });

    // Convert to AdvancedTermCombiner format
    const advancedTerms = terms.map(t => ({
      term: t.term,
      sign: t.sign,
    }));

    const simplified = AdvancedTermCombiner.combineTerms(advancedTerms);

    if (simplified.length === 0) {
      return { type: 'NumberLiteral', value: 0 };
    }

    if (simplified.length === 1) {
      const term = simplified[0];
      if (term && term.sign === 1) {
        return term.term;
      } else if (term && term.sign === -1) {
        return { type: 'UnaryExpression', operator: '-', operand: term.term };
      }
    }

    return buildAdditionFromTerms(simplified);
  }

  return { type: 'BinaryExpression', operator: '+', left, right };
}

/**
 * Simplify division
 */
function simplifyDivision(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // 0 / x = 0 (x ≠ 0)
  if (left.type === 'NumberLiteral' && left.value === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // x / 1 = x
  if (right.type === 'NumberLiteral' && right.value === 1) return left;

  // Number / Number - keep as fraction to preserve exact values
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral' && right.value !== 0) {
    // Only convert to decimal if it results in a whole number
    const result = left.value / right.value;
    if (Number.isInteger(result)) {
      return { type: 'NumberLiteral', value: result };
    }
    // Otherwise, keep as fraction and reduce it
    const reduced = reduceFraction(left.value, right.value);
    if (reduced.den === 1) {
      return { type: 'NumberLiteral', value: reduced.num };
    }
    return {
      type: 'Fraction',
      numerator: { type: 'NumberLiteral', value: reduced.num },
      denominator: { type: 'NumberLiteral', value: reduced.den },
    };
  }

  // x / x = 1
  if (areEquivalentExpressions(left, right)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // Convert to fraction for better handling
  return { type: 'Fraction', numerator: left, denominator: right };
}

/**
 * Simplify power expressions
 */
function simplifyPower(
  base: ASTNode,
  exponent: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // x^0 = 1
  if (exponent.type === 'NumberLiteral' && exponent.value === 0) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // x^1 = x
  if (exponent.type === 'NumberLiteral' && exponent.value === 1) return base;

  // Number^Number
  if (base.type === 'NumberLiteral' && exponent.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: Math.pow(base.value, exponent.value) };
  }

  // Default: return as BinaryExpression
  return { type: 'BinaryExpression', operator: '^', left: base, right: exponent };
}

/**
 * Simplify fractions with polynomial support
 */
function simplifyFraction(
  node: Fraction,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // First, expand both numerator and denominator if they contain distributive expressions
  let numerator = node.numerator;
  let denominator = node.denominator;

  // Handle complex fractions first: (a/b) / (c/d) = (a*d) / (b*c)
  if (numerator.type === 'Fraction' && denominator.type === 'Fraction') {
    const newNumerator = {
      type: 'BinaryExpression' as const,
      operator: '*' as const,
      left: numerator.numerator,
      right: denominator.denominator,
    };
    const newDenominator = {
      type: 'BinaryExpression' as const,
      operator: '*' as const,
      left: numerator.denominator,
      right: denominator.numerator,
    };
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: newNumerator,
        denominator: newDenominator,
      },
      options,
      depth + 1
    );
  }

  // Handle (a/b) / c = a / (b*c)
  if (numerator.type === 'Fraction') {
    const newDenominator = {
      type: 'BinaryExpression' as const,
      operator: '*' as const,
      left: numerator.denominator,
      right: denominator,
    };
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: numerator.numerator,
        denominator: newDenominator,
      },
      options,
      depth + 1
    );
  }

  // Handle a / (b/c) = (a*c) / b
  if (denominator.type === 'Fraction') {
    const newNumerator = {
      type: 'BinaryExpression' as const,
      operator: '*' as const,
      left: numerator,
      right: denominator.denominator,
    };
    return simplifyFraction(
      {
        type: 'Fraction',
        numerator: newNumerator,
        denominator: denominator.numerator,
      },
      options,
      depth + 1
    );
  }

  // Apply expansion to handle polynomial expressions in fractions
  if (options.expand) {
    numerator = expandExpression(numerator);
    denominator = expandExpression(denominator);
  }

  // Then apply basic simplification
  numerator = basicSimplify(numerator, options, depth + 1);
  denominator = basicSimplify(denominator, options, depth + 1);

  // x / 1 = x
  if (denominator.type === 'NumberLiteral' && denominator.value === 1) {
    return numerator;
  }

  // 0 / x = 0
  if (numerator.type === 'NumberLiteral' && numerator.value === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Reduce numeric fractions
  if (
    numerator.type === 'NumberLiteral' &&
    denominator.type === 'NumberLiteral' &&
    denominator.value !== 0 &&
    options.simplifyFractions
  ) {
    const reduced = reduceFraction(numerator.value, denominator.value);
    if (reduced.den === 1) {
      return { type: 'NumberLiteral', value: reduced.num };
    }
    return {
      type: 'Fraction',
      numerator: { type: 'NumberLiteral', value: reduced.num },
      denominator: { type: 'NumberLiteral', value: reduced.den },
    };
  }

  // For polynomial fractions, apply basic polynomial simplification only
  if (options.simplifyFractions) {
    const simplified = simplifyPolynomialFraction(numerator, denominator);
    if (simplified) {
      return simplified;
    }
  }

  return { type: 'Fraction', numerator, denominator };
}

/**
 * Simplify polynomial fractions by finding common factors
 */
function simplifyPolynomialFraction(numerator: ASTNode, denominator: ASTNode): ASTNode | null {
  // For now, handle simple cases
  // This could be expanded to handle more complex polynomial GCD

  // Check if numerator and denominator are identical
  if (areEquivalentExpressions(numerator, denominator)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // Check for multiplication patterns: (a*b) / a = b
  if (numerator.type === 'BinaryExpression' && numerator.operator === '*') {
    if (areEquivalentExpressions(numerator.left, denominator)) {
      return numerator.right;
    }
    if (areEquivalentExpressions(numerator.right, denominator)) {
      return numerator.left;
    }
  }

  // Check for multiplication patterns in denominator: a / (a*b) = 1/b
  if (denominator.type === 'BinaryExpression' && denominator.operator === '*') {
    if (areEquivalentExpressions(numerator, denominator.left)) {
      return {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: 1 },
        denominator: denominator.right,
      };
    }
    if (areEquivalentExpressions(numerator, denominator.right)) {
      return {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: 1 },
        denominator: denominator.left,
      };
    }
  }

  return null;
}

/**
 * Apply structural simplifications (flattening, reordering)
 */
function applyStructuralSimplifications(
  node: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // This can be extended for more structural optimizations
  return node;
}

/**
 * Extract terms from an addition expression
 */
function extractAdditionTerms(node: ASTNode): Array<{ term: ASTNode; sign: number }> {
  // Handle UnaryExpression with negative operator
  if (node.type === 'UnaryExpression' && node.operator === '-') {
    const innerTerms = extractAdditionTerms(node.operand);
    return innerTerms.map(t => ({ term: t.term, sign: -t.sign }));
  }

  // Handle UnaryExpression with positive operator
  if (node.type === 'UnaryExpression' && node.operator === '+') {
    return extractAdditionTerms(node.operand);
  }

  if (node.type !== 'BinaryExpression') {
    return [{ term: node, sign: 1 }];
  }

  const expr = node as BinaryExpression;

  if (expr.operator === '+') {
    return [...extractAdditionTerms(expr.left), ...extractAdditionTerms(expr.right)];
  }

  if (expr.operator === '-') {
    const leftTerms = extractAdditionTerms(expr.left);
    const rightTerms = extractAdditionTerms(expr.right).map(t => ({
      term: t.term,
      sign: -t.sign,
    }));
    return [...leftTerms, ...rightTerms];
  }

  return [{ term: node, sign: 1 }];
}

/**
 * Build addition expression from terms with signs
 */
function buildAdditionFromTerms(terms: Array<{ term: ASTNode; sign: number }>): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  if (terms.length === 1) {
    const term = terms[0];
    if (term && term.sign === 1) {
      return term.term;
    } else if (term && term.sign === -1) {
      return { type: 'UnaryExpression', operator: '-', operand: term.term };
    }
  }

  let result = terms[0]?.term;
  if (!result) return { type: 'NumberLiteral', value: 0 };

  if (terms[0]?.sign === -1) {
    result = { type: 'UnaryExpression', operator: '-', operand: result };
  }

  for (let i = 1; i < terms.length; i++) {
    const term = terms[i];
    if (!term) continue;

    if (term.sign === 1) {
      result = {
        type: 'BinaryExpression',
        operator: '+',
        left: result,
        right: term.term,
      };
    } else {
      result = {
        type: 'BinaryExpression',
        operator: '-',
        left: result,
        right: term.term,
      };
    }
  }

  return result;
}

export function gcd(a: number, b: number): number {
  return gcd_simplify(a, b);
}
