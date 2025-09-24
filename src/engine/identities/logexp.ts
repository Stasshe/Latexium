import type { ASTNode } from '@/types/ast';

/**
 * Apply logarithm and exponential identities to an AST node.
 * e.g. log(a*b) = log(a) + log(b), exp(a+b) = exp(a)exp(b)
 * Returns a new ASTNode if a transformation is found, otherwise returns the input node.
 */
export function applyLogExpIdentities(node: ASTNode): ASTNode {
  // e^{ln(x)} = x
  if (
    node.type === 'BinaryExpression' &&
    node.operator === '^' &&
    node.left.type === 'Identifier' &&
    node.left.name === 'e' &&
    node.right.type === 'FunctionCall' &&
    node.right.name === 'ln' &&
    node.right.args.length === 1 &&
    node.right.args[0]
  ) {
    return node.right.args[0];
  }
  // a^(log_a(b)) = b
  if (
    node.type === 'BinaryExpression' &&
    node.operator === '^' &&
    node.left.type === 'Identifier' &&
    node.right.type === 'FunctionCall' &&
    (node.right.name === 'log' || node.right.name === 'ln') &&
    node.right.args.length >= 1 &&
    node.right.args[1] &&
    node.right.args[1].type === 'Identifier' &&
    node.left.name === node.right.args[1].name &&
    node.right.args[0]
  ) {
    // a^(log_a(b)) = b
    return node.right.args[0];
  }
  // ln(e) = 1
  if (
    node.type === 'FunctionCall' &&
    node.name === 'ln' &&
    node.args.length === 1 &&
    node.args[0] &&
    node.args[0].type === 'Identifier' &&
    (node.args[0].name === 'e' || node.args[0].name === 'E')
  ) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // log_b(bx) = log_b(x) + 1, log_b(xb) = log_b(x) + 1
  if (
    node.type === 'FunctionCall' &&
    (node.name === 'log' || node.name === 'ln') &&
    node.args[0] &&
    node.args[1] &&
    node.args[0].type === 'BinaryExpression' &&
    node.args[0].operator === '*' &&
    (JSON.stringify(node.args[1]) === JSON.stringify(node.args[0].left) ||
      JSON.stringify(node.args[1]) === JSON.stringify(node.args[0].right))
  ) {
    // log_b(b*x) = log_b(x) + 1
    const base = node.args[1];
    const x =
      JSON.stringify(base) === JSON.stringify(node.args[0].left)
        ? node.args[0].right
        : node.args[0].left;
    return {
      type: 'BinaryExpression',
      operator: '+',
      left: {
        type: 'FunctionCall',
        name: node.name,
        args: [x, base],
      },
      right: { type: 'NumberLiteral', value: 1 },
    };
  }

  // log_b(xy) = log_b(x) + log_b(y) (xyが積でbで割り切れない場合)
  if (
    node.type === 'FunctionCall' &&
    (node.name === 'log' || node.name === 'ln') &&
    node.args[0] &&
    node.args[0].type === 'BinaryExpression' &&
    node.args[0].operator === '*' &&
    node.args[1]
  ) {
    const base = node.args[1];
    const left = node.args[0].left;
    const right = node.args[0].right;
    return {
      type: 'BinaryExpression',
      operator: '+',
      left: {
        type: 'FunctionCall',
        name: node.name,
        args: [left, base],
      },
      right: {
        type: 'FunctionCall',
        name: node.name,
        args: [right, base],
      },
    };
  }

  // log_b(n) で n が b の累乗×整数 の場合、log_b(n) = k + log_b(m) の形に分解
  if (
    node.type === 'FunctionCall' &&
    (node.name === 'log' || node.name === 'ln') &&
    node.args[0] &&
    node.args[1] &&
    node.args[0].type === 'NumberLiteral' &&
    node.args[1].type === 'NumberLiteral'
  ) {
    const n = node.args[0].value;
    const b = node.args[1].value;
    if (b > 1 && n > 1) {
      // n = b^k * m となる最大のk, mを求める
      let k = 0;
      let m = n;
      while (m % b === 0) {
        m = m / b;
        k++;
      }
      if (k > 0 && m > 1) {
        // 例: log_2(12) = log_2(2^2*3) = 2 + log_2(3)
        return {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'NumberLiteral', value: k },
          right: {
            type: 'FunctionCall',
            name: node.name,
            args: [
              { type: 'NumberLiteral', value: m },
              { type: 'NumberLiteral', value: b },
            ],
          },
        };
      } else if (k > 0 && m === 1) {
        // 完全な累乗: log_b(b^k) = k
        return { type: 'NumberLiteral', value: k };
      }
    }
  }
  // log_{b}{b^k} = k, log_{b}{b} = 1, log_{b}{1} = 0, log_{10}{100} = 2 など
  if (node.type === 'FunctionCall' && (node.name === 'log' || node.name === 'ln') && node.args[0]) {
    const arg = node.args[0];
    // baseはargs[1]（なければe）
    const base = node.args[1];
    // log_{b}{b^k} = k
    if (arg.type === 'BinaryExpression' && arg.operator === '^' && base) {
      // log_{b}{b^k}
      // baseとarg.leftが一致
      if (JSON.stringify(base) === JSON.stringify(arg.left)) {
        return arg.right;
      }
    }
    // log_{b}{b} = 1
    if (base && JSON.stringify(base) === JSON.stringify(arg)) {
      return { type: 'NumberLiteral', value: 1 };
    }
    // log_{b}{1} = 0
    if (arg.type === 'NumberLiteral' && arg.value === 1) {
      return { type: 'NumberLiteral', value: 0 };
    }
    // log_{10}{100} = 2 など（整数化）
    if (base && base.type === 'NumberLiteral' && arg.type === 'NumberLiteral') {
      const b = base.value;
      const x = arg.value;
      if (b > 0 && b !== 1 && x > 0) {
        const logVal = Math.log(x) / Math.log(b);
        if (Math.abs(logVal - Math.round(logVal)) < 1e-12) {
          return { type: 'NumberLiteral', value: Math.round(logVal) };
        }
      }
    }
    // log_{e}{x} → ln(x)
    if (base && base.type === 'Identifier' && (base.name === 'e' || base.name === 'E')) {
      return {
        type: 'FunctionCall',
        name: 'ln',
        args: [arg],
      };
    }
    // log_{e}{x}（base省略）→ ln(x)
    if (!base && node.name === 'log') {
      return {
        type: 'FunctionCall',
        name: 'ln',
        args: [arg],
      };
    }
  }
  // log(a*b) = log(a) + log(b)
  if (isLogProduct(node)) {
    if (
      node.type === 'FunctionCall' &&
      node.args[0] &&
      (node.name === 'log' || node.name === 'ln')
    ) {
      const arg = node.args[0];
      if (arg.type === 'BinaryExpression' && arg.operator === '*') {
        return {
          type: 'BinaryExpression',
          operator: '+',
          left: {
            type: 'FunctionCall',
            name: node.name,
            args: [arg.left],
          },
          right: {
            type: 'FunctionCall',
            name: node.name,
            args: [arg.right],
          },
        };
      }
    }
  }
  // log(a^b) = b*log(a)
  if (isLogPower(node)) {
    if (
      node.type === 'FunctionCall' &&
      node.args[0] &&
      (node.name === 'log' || node.name === 'ln')
    ) {
      const arg = node.args[0];
      if (arg.type === 'BinaryExpression' && arg.operator === '^') {
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: arg.right,
          right: {
            type: 'FunctionCall',
            name: node.name,
            args: [arg.left],
          },
        };
      }
    }
  }
  // exp(a+b) = exp(a)exp(b)
  if (isExpSum(node)) {
    if (node.type === 'FunctionCall' && node.args[0] && node.name === 'exp') {
      const arg = node.args[0];
      if (arg.type === 'BinaryExpression' && arg.operator === '+') {
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: {
            type: 'FunctionCall',
            name: 'exp',
            args: [arg.left],
          },
          right: {
            type: 'FunctionCall',
            name: 'exp',
            args: [arg.right],
          },
        };
      }
    }
  }
  // exp(a-b) = exp(a)/exp(b)
  if (isExpDiff(node)) {
    if (node.type === 'FunctionCall' && node.args[0] && node.name === 'exp') {
      const arg = node.args[0];
      if (arg.type === 'BinaryExpression' && arg.operator === '-') {
        return {
          type: 'Fraction',
          numerator: {
            type: 'FunctionCall',
            name: 'exp',
            args: [arg.left],
          },
          denominator: {
            type: 'FunctionCall',
            name: 'exp',
            args: [arg.right],
          },
        };
      }
    }
  }
  return node;
}

function isLogProduct(node: ASTNode): boolean {
  // log(a*b)
  return (
    node.type === 'FunctionCall' &&
    (node.name === 'log' || node.name === 'ln') &&
    node.args.length === 1 &&
    node.args[0] !== undefined &&
    node.args[0].type === 'BinaryExpression' &&
    node.args[0].operator === '*'
  );
}

function isLogPower(node: ASTNode): boolean {
  // log(a^b)
  return (
    node.type === 'FunctionCall' &&
    (node.name === 'log' || node.name === 'ln') &&
    node.args.length === 1 &&
    node.args[0] !== undefined &&
    node.args[0].type === 'BinaryExpression' &&
    node.args[0].operator === '^'
  );
}

function isExpSum(node: ASTNode): boolean {
  // exp(a+b)
  return (
    node.type === 'FunctionCall' &&
    node.name === 'exp' &&
    node.args.length === 1 &&
    node.args[0] !== undefined &&
    node.args[0].type === 'BinaryExpression' &&
    node.args[0].operator === '+'
  );
}

function isExpDiff(node: ASTNode): boolean {
  // exp(a-b)
  return (
    node.type === 'FunctionCall' &&
    node.name === 'exp' &&
    node.args.length === 1 &&
    node.args[0] !== undefined &&
    node.args[0].type === 'BinaryExpression' &&
    node.args[0].operator === '-'
  );
}
