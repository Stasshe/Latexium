import { ASTNode, BinaryExpression, NumberLiteral, Identifier } from '@/types';

export interface FactorizationPattern {
  name: string;
  description: string;
  matches(node: ASTNode): boolean;
  factor(node: ASTNode): ASTNode | null;
}

export class PatternUtils {
  static getCoefficient(node: ASTNode): number {
    if (node.type === 'NumberLiteral') {
      return node.value;
    }
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (node.left.type === 'NumberLiteral') {
        return node.left.value;
      }
      if (node.right.type === 'NumberLiteral') {
        return node.right.value;
      }
    }
    return 1;
  }

  static getVariablePart(node: ASTNode): ASTNode | null {
    if (node.type === 'Identifier') {
      return node;
    }
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      return node;
    }
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (node.left.type === 'NumberLiteral') {
        return node.right;
      }
      if (node.right.type === 'NumberLiteral') {
        return node.left;
      }
    }
    return null;
  }

  static gcd(a: number, b: number): number {
    if (b === 0) return Math.abs(a);
    return this.gcd(b, a % b);
  }

  static gcdArray(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) {
      const first = numbers[0];
      return first !== undefined ? Math.abs(first) : 1;
    }
    let result = numbers[0];
    if (result === undefined) return 1;
    for (let i = 1; i < numbers.length; i++) {
      const current = numbers[i];
      if (current === undefined) continue;
      result = this.gcd(result, current);
      if (result === 1) break;
    }
    return Math.abs(result);
  }

  static areStructurallyEqual(a: ASTNode, b: ASTNode): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
      case 'NumberLiteral':
        return (a as NumberLiteral).value === (b as NumberLiteral).value;
      case 'Identifier': {
        const idA = a as Identifier;
        const idB = b as Identifier;
        return idA.name === idB.name;
      }
      case 'BinaryExpression': {
        const binA = a as BinaryExpression;
        const binB = b as BinaryExpression;
        return (
          binA.operator === binB.operator &&
          this.areStructurallyEqual(binA.left, binB.left) &&
          this.areStructurallyEqual(binA.right, binB.right)
        );
      }
      default:
        return false;
    }
  }

  static createNumber(value: number): NumberLiteral {
    return {
      type: 'NumberLiteral',
      value: value,
    };
  }

  static createIdentifier(name: string): Identifier {
    return {
      type: 'Identifier',
      name: name,
    };
  }

  static createBinaryExpression(
    left: ASTNode,
    operator: '+' | '-' | '*' | '/' | '^' | '=' | '>' | '<' | '>=' | '<=',
    right: ASTNode
  ): BinaryExpression {
    return {
      type: 'BinaryExpression',
      left: left,
      operator: operator,
      right: right,
    };
  }
}
