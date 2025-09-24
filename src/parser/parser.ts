/**
 * LaTeX Parser
 * Parses tokenized LaTeX mathematical expressions into AST
 */

import {
  ASTNode,
  Fraction,
  FunctionCall,
  Identifier,
  NumberLiteral,
  ParseResult,
  RESERVED_FUNCTIONS,
  RESERVED_SYMBOLS,
} from '../types';
import { LaTeXTokenizer, Token, TokenType } from './tokenizer';
import { resolveScopeInAST } from '../engine/scope';
import { validateFunctionArgs } from '../engine/validation';

import { config } from '@/config';

export class LaTeXParser {
  private tokens: Token[];
  private currentTokenIndex: number;
  private currentToken: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.currentTokenIndex = 0;
    this.currentToken = tokens[0] || { type: 'EOF', value: '', position: 0 };
  }

  /**
   * Advance to the next token
   */
  private advance(): void {
    this.currentTokenIndex++;
    if (this.currentTokenIndex < this.tokens.length) {
      this.currentToken = this.tokens[this.currentTokenIndex] ?? {
        type: 'EOF',
        value: '',
        position: 0,
      };
    }
  }

  /**
   * Peek at the next token without advancing
   */
  private peek(): Token {
    const nextIndex = this.currentTokenIndex + 1;
    return nextIndex < this.tokens.length
      ? (this.tokens[nextIndex] ?? { type: 'EOF', value: '', position: 0 })
      : { type: 'EOF', value: '', position: 0 };
  }

  /**
   * Check if current token matches expected type
   */
  private expectToken(expectedType: TokenType): boolean {
    return this.currentToken.type === expectedType;
  }

  /**
   * Consume a token of expected type or throw error
   */
  private consume(expectedType: TokenType): Token {
    if (this.currentToken.type !== expectedType) {
      throw new Error(
        `Expected ${expectedType} but got ${this.currentToken.type} at position ${this.currentToken.position}`
      );
    }
    const token = this.currentToken;
    this.advance();
    return token;
  }

  /**
   * Parse a number literal
   */
  private parseNumber(): NumberLiteral {
    const token = this.consume('NUMBER');
    const value = parseFloat(token.value);

    if (isNaN(value)) {
      throw new Error(`Invalid number: ${token.value} at position ${token.position}`);
    }

    return {
      type: 'NumberLiteral',
      value,
    };
  }

  /**
   * Parse an identifier (variable or function name)
   */
  /**
   * Parse an identifier (variable or function name)
   * @param allowReserved - trueなら予約語チェックをスキップ（d専用）
   */
  private parseIdentifier(allowReserved = false): Identifier {
    const token = this.consume('IDENTIFIER');

    // Only check for reserved function names and symbols unless allowed
    if (
      !allowReserved &&
      (RESERVED_FUNCTIONS.has(token.value) || RESERVED_SYMBOLS.has(token.value))
    ) {
      throw new Error(
        `Reserved word cannot be used as variable name: ${token.value} at position ${token.position}`
      );
    }

    return {
      type: 'Identifier',
      name: token.value,
    };
  }

  /**
   * Parse a function call
   */
  private parseFunctionCall(functionName: string, position: number): FunctionCall {
    // Expect opening parenthesis
    this.consume('LPAREN');

    const args: ASTNode[] = [];

    // Parse arguments
    if (!this.expectToken('RPAREN')) {
      args.push(this.parseExpression());

      while (this.expectToken('COMMA')) {
        this.advance(); // consume comma
        args.push(this.parseExpression());
      }
    }

    this.consume('RPAREN');

    // Validate argument count
    const argError = validateFunctionArgs(functionName, args.length);
    if (argError) {
      throw new Error(`${argError} at position ${position}`);
    }

    return {
      type: 'FunctionCall',
      name: functionName,
      args,
    };
  }

  /**
   * Parse a primary expression (numbers, identifiers, parentheses, functions)
   */
  private parsePrimary(): ASTNode {
    if (this.expectToken('NUMBER')) {
      return this.parseNumber();
    }

    if (this.expectToken('IDENTIFIER')) {
      const token = this.currentToken;
      const identifier = this.parseIdentifier();

      // Check if this is a function call vs implicit multiplication
      // Rules:
      // 1. If it's a reserved function (sin, cos, etc.), treat as function
      // 2. If it's a common function name (f, g, h), treat as function
      // 3. If the first thing in parentheses is negative, treat as multiplication
      // 4. Otherwise, treat as multiplication for single letter variables
      if (this.expectToken('LPAREN')) {
        const isReservedFunction = this.isFunction(identifier.name);
        const isCommonFunction = config.COMMON_FUNCTION_NAMES.has(identifier.name);

        // Look ahead to see if the first thing inside parentheses is negative
        let startsWithNegative = false;
        if (this.currentTokenIndex + 1 < this.tokens.length) {
          const nextToken = this.tokens[this.currentTokenIndex + 1];
          startsWithNegative = nextToken?.type === 'OPERATOR' && nextToken?.value === '-';
        }

        // Treat as function if it's a known function OR common function name
        // Treat as multiplication if it starts with negative OR is single letter variable
        const shouldTreatAsFunction = isReservedFunction || isCommonFunction;
        const shouldTreatAsMultiplication =
          startsWithNegative || (!shouldTreatAsFunction && identifier.name.length === 1);

        if (shouldTreatAsMultiplication) {
          // Don't consume the parentheses, let implicit multiplication handle it
          return identifier;
        }

        const functionCall = this.parseFunctionCall(identifier.name, token.position);

        // Check for function exponentiation like sin^2(x)
        if (this.expectToken('CARET')) {
          this.advance(); // consume '^'

          let exponent: ASTNode;
          if (this.expectToken('LBRACE')) {
            this.consume('LBRACE');
            exponent = this.parseAddition();
            this.consume('RBRACE');
          } else {
            exponent = this.parseUnary();
          }

          return {
            type: 'BinaryExpression',
            operator: '^',
            left: functionCall,
            right: exponent,
          };
        }

        return functionCall;
      }

      return identifier;
    }

    if (this.expectToken('LPAREN')) {
      this.advance(); // consume '('
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    if (this.expectToken('COMMAND')) {
      return this.parseCommand();
    }

    throw new Error(
      `Unexpected token: ${this.currentToken.value} at position ${this.currentToken.position}`
    );
  }

  /**
   * Parse a LaTeX command
   */
  private parseCommand(): ASTNode {
    const token = this.consume('COMMAND');

    switch (token.value) {
      case '\\int': {
        // Parse optional lower bound (_{...}) and upper bound (^{...})
        let lowerBound: ASTNode | undefined = undefined;
        let upperBound: ASTNode | undefined = undefined;
        if (this.expectToken('UNDERSCORE')) {
          this.advance(); // consume _
          if (this.expectToken('LBRACE')) {
            this.consume('LBRACE');
            lowerBound = this.parseExpression();
            this.consume('RBRACE');
          } else {
            lowerBound = this.parsePrimary();
          }
        }
        if (this.expectToken('CARET')) {
          this.advance(); // consume ^
          if (this.expectToken('LBRACE')) {
            this.consume('LBRACE');
            upperBound = this.parseExpression();
            this.consume('RBRACE');
          } else {
            upperBound = this.parsePrimary();
          }
        }
        // Parse integrand (stop at dx/dt/du etc.)
        // Find the index where IDENTIFIER 'd' or /^d[a-zA-Z]$/ appears (dx/dt/du)
        let integrandEnd = this.currentTokenIndex;
        while (integrandEnd < this.tokens.length) {
          const t = this.tokens[integrandEnd];
          if (!t) break;
          if (t.type === 'IDENTIFIER') {
            if (t.value === 'd') {
              const next = this.tokens[integrandEnd + 1];
              if (next && next.type === 'IDENTIFIER' && /^[a-zA-Z]$/.test(next.value)) {
                break; // dxパターン
              }
              break; // d単体
            } else if (/^d[a-zA-Z]$/.test(t.value)) {
              break; // dx, dt, duパターン
            }
          }
          integrandEnd++;
        }
        // サブパーサーでintegrand部分だけパース
        const integrandTokens = this.tokens.slice(this.currentTokenIndex, integrandEnd);
        if (integrandTokens.length === 0) {
          throw new Error('Missing integrand before dx/dt/du');
        }
        const subParser = new LaTeXParser(
          integrandTokens.concat([{ type: 'EOF', value: '', position: 0 }])
        );
        const integrand = subParser.parseExpression();
        // トークン位置をintegrandEndに進める
        this.currentTokenIndex = integrandEnd;
        this.currentToken = this.tokens[this.currentTokenIndex] || {
          type: 'EOF',
          value: '',
          position: 0,
        };
        // Parse dx, dt, ... (must be IDENTIFIER, e.g. dx, dt, du)
        let variable: string | undefined = undefined;
        // Allow whitespace between integrand and dx
        while (this.currentToken.type === 'WHITESPACE') this.advance();
        // Robustly handle both IDENTIFIER: 'dx' or IDENTIFIER: 'd' + IDENTIFIER: 'x'
        if (this.expectToken('IDENTIFIER')) {
          const first = this.currentToken;
          if (first.value === 'd') {
            this.advance();
            if (this.expectToken('IDENTIFIER') && /^[a-zA-Z]$/.test(this.currentToken.value)) {
              const second = this.currentToken;
              variable = second.value;
              this.advance();
            } else {
              throw new Error(
                `Expected dx/dt/du etc. after integrand at position ${first.position}`
              );
            }
          } else if (/^d[a-zA-Z]$/.test(first.value)) {
            variable = first.value.substring(1);
            this.advance();
          } else {
            throw new Error(`Expected dx/dt/du etc. after integrand at position ${first.position}`);
          }
        } else {
          throw new Error(
            `Expected dx/dt/du etc. after integrand at position ${this.currentToken.position}`
          );
        }
        return {
          type: 'Integral',
          integrand,
          variable: variable!,
          ...(lowerBound !== undefined ? { lowerBound } : {}),
          ...(upperBound !== undefined ? { upperBound } : {}),
        };
      }
      case '\\frac':
        return this.parseFraction();
      case '\\sqrt':
        return this.parseSqrt();
      case '\\sin':
      case '\\cos':
      case '\\tan':
      case '\\log':
      case '\\ln':
      case '\\exp': {
        const functionName = token.value.substring(1); // Remove backslash

        // Check for function exponentiation before parentheses like \sin^2(x)
        if (this.expectToken('CARET')) {
          this.advance(); // consume '^'

          let exponent: ASTNode;
          if (this.expectToken('LBRACE')) {
            this.consume('LBRACE');
            exponent = this.parseAddition();
            this.consume('RBRACE');
          } else {
            exponent = this.parseUnary();
          }

          // Now expect and parse the function call
          if (!this.expectToken('LPAREN')) {
            throw new Error(
              `Expected function arguments after exponent at position ${this.currentToken.position}`
            );
          }

          const functionCall = this.parseFunctionCall(functionName, token.position);

          return {
            type: 'BinaryExpression',
            operator: '^',
            left: functionCall,
            right: exponent,
          };
        }

        // Normal function call
        return this.parseFunctionCall(functionName, token.position);
      }
      case '\\pi':
        // Return π as an identifier (mathematical constant)
        return {
          type: 'Identifier',
          name: 'π',
        };
      case '\\e':
        // Return e as an identifier (mathematical constant)
        return {
          type: 'Identifier',
          name: 'e',
        };
      case '\\factorial': {
        // Parse argument for factorial (postfix, so previous expression is the argument)
        // In this context, parseCommand is only called when COMMAND is at the start of a primary, so we need to handle as prefix (rare)
        // But for postfix, handled in parsePower (see below)
        // For robustness, allow {expr} or (expr) or next primary
        let argument: ASTNode;
        if (this.expectToken('LBRACE')) {
          this.consume('LBRACE');
          argument = this.parseExpression();
          this.consume('RBRACE');
        } else if (this.expectToken('LPAREN')) {
          this.consume('LPAREN');
          argument = this.parseExpression();
          this.consume('RPAREN');
        } else {
          argument = this.parsePrimary();
        }
        return {
          type: 'Factorial',
          argument,
        };
      }
      default:
        throw new Error(`Unsupported LaTeX command: ${token.value} at position ${token.position}`);
    }
  }

  /**
   * Parse a fraction \\frac{numerator}{denominator}
   */
  /**
   * Parse a fraction \frac{numerator}{denominator}
   * Special handling for \frac{d}{dx}[expr] → Derivative node
   */
  private parseFraction(): Fraction | ASTNode {
    // Numerator
    this.consume('LBRACE');
    let numerator: Identifier | ASTNode;
    let isNumeratorD = false;
    if (this.expectToken('IDENTIFIER') && this.currentToken.value === 'd') {
      numerator = this.parseIdentifier(true);
      isNumeratorD = true;
    } else {
      numerator = this.parseExpression();
    }
    this.consume('RBRACE');

    // Denominator
    this.consume('LBRACE');
    let denominator: Identifier | ASTNode;
    let denominatorVar: string | null = null;
    let isDenominatorDStar = false;
    if (
      this.expectToken('IDENTIFIER') &&
      this.currentToken.value.length >= 1 &&
      this.currentToken.value[0] === 'd'
    ) {
      const token = this.currentToken;
      if (token.value.length >= 2) {
        // d* (e.g. dx, dt, du)
        denominator = this.parseIdentifier(true);
        denominatorVar = token.value.substring(1);
        isDenominatorDStar = true;
      } else if (token.value === 'd') {
        // d + x pattern
        this.advance();
        if (this.expectToken('IDENTIFIER')) {
          const xToken = this.currentToken;
          denominatorVar = xToken.value;
          this.advance();
          denominator = { type: 'Identifier', name: 'd' + denominatorVar };
          isDenominatorDStar = true;
        } else {
          denominator = { type: 'Identifier', name: 'd' };
        }
      } else {
        denominator = this.parseIdentifier();
      }
    } else {
      denominator = this.parseExpression();
    }
    this.consume('RBRACE');

    // 分子がdの時のみDerivative判定
    if (
      isNumeratorD &&
      isDenominatorDStar &&
      typeof denominatorVar === 'string' &&
      denominatorVar.length >= 1
    ) {
      // Skip whitespace tokens if any
      while (this.currentToken.type === 'WHITESPACE') this.advance();
      // Accept {expr}, (expr), or [expr] after the fraction
      let expr: ASTNode | null = null;
      if (this.expectToken('LBRACE')) {
        this.consume('LBRACE');
        expr = this.parseExpression();
        this.consume('RBRACE');
      } else if (this.expectToken('LPAREN')) {
        this.consume('LPAREN');
        expr = this.parseExpression();
        this.consume('RPAREN');
      } else if (this.expectToken('LBRACKET')) {
        this.consume('LBRACKET');
        expr = this.parseExpression();
        this.consume('RBRACKET');
      } else {
        // 何もなければ、残り全体をexprとする
        const restTokens = this.tokens.slice(this.currentTokenIndex, this.tokens.length - 1); // EOF除く
        if (restTokens.length === 0) {
          throw new Error('Expected expression after \\frac{d}{d*}');
        }
        const subParser = new LaTeXParser(
          restTokens.concat([{ type: 'EOF', value: '', position: 0 }])
        );
        expr = subParser.parseExpression();
        // トークン位置を最後まで進める
        this.currentTokenIndex = this.tokens.length - 1;
        this.currentToken = this.tokens[this.currentTokenIndex] || {
          type: 'EOF',
          value: '',
          position: 0,
        };
      }
      return {
        type: 'Derivative',
        variable: denominatorVar,
        expression: expr,
      };
    }

    // 通常の分数
    return {
      type: 'Fraction',
      numerator,
      denominator,
    };
  }

  /**
   * Parse a square root \\sqrt{expression}
   */
  private parseSqrt(): FunctionCall {
    this.consume('LBRACE');
    const argument = this.parseExpression();
    this.consume('RBRACE');

    return {
      type: 'FunctionCall',
      name: 'sqrt',
      args: [argument],
    };
  }

  /**
   * Parse unary expressions (+ and - operators)
   */
  private parseUnary(): ASTNode {
    if (
      this.expectToken('OPERATOR') &&
      (this.currentToken.value === '+' || this.currentToken.value === '-')
    ) {
      const operator = this.currentToken.value as '+' | '-';
      this.advance();
      const operand = this.parseUnary();

      return {
        type: 'UnaryExpression',
        operator,
        operand,
      };
    }

    return this.parsePower();
  }

  /**
   * Parse power expressions (^ operator)
   */
  private parsePower(): ASTNode {
    let left = this.parsePrimary();

    while (this.expectToken('CARET')) {
      this.advance(); // consume '^'

      let right: ASTNode;

      // Handle braces for exponents like x^{-2}
      if (this.expectToken('LBRACE')) {
        this.consume('LBRACE');
        right = this.parseAddition();
        this.consume('RBRACE');
      } else {
        right = this.parseUnary();
      }

      left = {
        type: 'BinaryExpression',
        operator: '^',
        left,
        right,
      };
    }

    // Support both \factorial (COMMAND) and ! (FACTORIAL) as postfix
    while (
      (this.expectToken('COMMAND') && this.currentToken.value === '\\factorial') ||
      this.expectToken('FACTORIAL')
    ) {
      this.advance(); // consume ! or \factorial
      left = {
        type: 'Factorial',
        argument: left,
      };
    }

    return left;
  }

  /**
   * Parse multiplication and division (including implicit multiplication)
   */
  private parseTerm(): ASTNode {
    let left = this.parseUnary();

    function toFractionDeep(node: ASTNode): ASTNode {
      if (node.type === 'BinaryExpression' && node.operator === '/') {
        return {
          type: 'Fraction',
          numerator: toFractionDeep(node.left),
          denominator: toFractionDeep(node.right),
        };
      }
      return node;
    }

    while (true) {
      // Explicit multiplication/division
      if (
        this.expectToken('OPERATOR') &&
        (this.currentToken.value === '*' || this.currentToken.value === '/')
      ) {
        const operator = this.currentToken.value as '*' | '/';
        this.advance();
        const right = this.parseUnary();

        if (operator === '/') {
          left = {
            type: 'Fraction',
            numerator: toFractionDeep(left),
            denominator: toFractionDeep(right),
          };
        } else {
          left = {
            type: 'BinaryExpression',
            operator,
            left: toFractionDeep(left),
            right: toFractionDeep(right),
          };
        }
      }
      // Implicit multiplication cases
      else if (this.isImplicitMultiplication()) {
        const right = this.parseUnary();

        left = {
          type: 'BinaryExpression',
          operator: '*',
          left: toFractionDeep(left),
          right: toFractionDeep(right),
        };
      } else {
        break;
      }
    }

    return toFractionDeep(left);
  }

  /**
   * Check if current position indicates implicit multiplication
   */
  private isImplicitMultiplication(): boolean {
    // Cases for implicit multiplication:
    // 1. NUMBER followed by IDENTIFIER (e.g., "2x")
    // 2. IDENTIFIER followed by IDENTIFIER (e.g., "xy")
    // 3. IDENTIFIER followed by LPAREN (e.g., "x(2+3)")
    // 4. RPAREN followed by IDENTIFIER (e.g., "(a+b)x")
    // 5. NUMBER followed by LPAREN (e.g., "2(x+1)")
    // 6. NUMBER followed by COMMAND (e.g., "2\pi")
    // 7. COMMAND followed by other expressions (e.g., "\pi x")

    const currentType = this.currentToken.type;

    return (
      currentType === 'IDENTIFIER' ||
      currentType === 'NUMBER' ||
      currentType === 'LPAREN' ||
      currentType === 'COMMAND'
    );
  }

  /**
   * Check if a command is a function
   */
  private isFunction(command: string): boolean {
    return RESERVED_FUNCTIONS.has(command);
  }

  /**
   * Parse equality and comparison operators (lowest precedence)
   */
  private parseEquality(): ASTNode {
    let left = this.parseAddition();

    while (
      this.expectToken('OPERATOR') &&
      (this.currentToken.value === '=' ||
        this.currentToken.value === '>' ||
        this.currentToken.value === '<' ||
        this.currentToken.value === '>=' ||
        this.currentToken.value === '<=')
    ) {
      const operator = this.currentToken.value as '=' | '>' | '<' | '>=' | '<=';
      this.advance();
      const right = this.parseAddition();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse addition and subtraction
   */
  private parseAddition(): ASTNode {
    let left = this.parseTerm();

    while (
      this.expectToken('OPERATOR') &&
      (this.currentToken.value === '+' || this.currentToken.value === '-')
    ) {
      const operator = this.currentToken.value as '+' | '-';
      this.advance();
      const right = this.parseTerm();

      // Fraction normalization: convert BinaryExpression '/' to Fraction
      function toFraction(node: ASTNode): ASTNode {
        if (node.type === 'BinaryExpression' && node.operator === '/') {
          return {
            type: 'Fraction',
            numerator: node.left,
            denominator: node.right,
          };
        }
        return node;
      }

      left = {
        type: 'BinaryExpression',
        operator,
        left: toFraction(left),
        right: toFraction(right),
      };
    }

    // left全体を再帰的にFraction化
    function toFractionDeep(node: ASTNode): ASTNode {
      if (node.type === 'BinaryExpression' && node.operator === '/') {
        return {
          type: 'Fraction',
          numerator: toFractionDeep(node.left),
          denominator: toFractionDeep(node.right),
        };
      }
      if (node.type === 'BinaryExpression') {
        return {
          ...node,
          left: toFractionDeep(node.left),
          right: toFractionDeep(node.right),
        };
      }
      return node;
    }
    return toFractionDeep(left);
  }

  /**
   * Parse the complete expression (top level)
   */
  private parseExpression(): ASTNode {
    return this.parseEquality();
  }

  /**
   * Parse the complete expression
   */
  public parse(): ASTNode {
    const ast = this.parseExpression();

    if (!this.expectToken('EOF')) {
      throw new Error(
        `Unexpected token at end of input: ${this.currentToken.value} at position ${this.currentToken.position}`
      );
    }

    return ast;
  }
}

/**
 * Main parsing function
 */
export function parseLatex(input: string): ParseResult {
  try {
    // Phase 1: Tokenization
    const tokenizer = new LaTeXTokenizer(input);
    const tokens = tokenizer.tokenize();

    // Check for tokenization errors
    const errorToken = tokens.find(token => token.type === 'ERROR');
    if (errorToken) {
      return {
        ast: null,
        error: `Invalid character: ${errorToken.value} at position ${errorToken.position}`,
      };
    }

    // Phase 2: Parsing
    const parser = new LaTeXParser(tokens);
    const rawAST = parser.parse();

    // Phase 3: Scope resolution
    const resolvedAST = resolveScopeInAST(rawAST);

    // Phase 4: Recursively convert all BinaryExpression '/' to Fraction
    function toFractionDeep(node: ASTNode): ASTNode {
      if (!node || typeof node !== 'object') return node;
      if (node.type === 'BinaryExpression' && node.operator === '/') {
        return {
          type: 'Fraction',
          numerator: toFractionDeep(node.left),
          denominator: toFractionDeep(node.right),
        };
      }
      // Recursively convert child nodes
      const newNode = { ...node } as Record<string, unknown>;
      for (const key of Object.keys(newNode)) {
        const value = newNode[key];
        if (Array.isArray(value)) {
          newNode[key] = value.map((item: ASTNode) => toFractionDeep(item));
        } else if (typeof value === 'object' && value !== null) {
          newNode[key] = toFractionDeep(value as ASTNode);
        }
      }
      return newNode as ASTNode;
    }

    return {
      ast: toFractionDeep(resolvedAST),
      error: null,
    };
  } catch (error) {
    return {
      ast: null,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
