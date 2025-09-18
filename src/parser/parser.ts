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
import { resolveScopeInAST } from '../utils/_scope';
import { validateFunctionArgs } from '../utils/validation';

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
  private parseIdentifier(): Identifier {
    const token = this.consume('IDENTIFIER');

    // Mathematical constants are allowed as identifiers, will be evaluated later
    // Only check for reserved function names and symbols
    if (RESERVED_FUNCTIONS.has(token.value) || RESERVED_SYMBOLS.has(token.value)) {
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

      // Check if this is a function call
      if (this.expectToken('LPAREN')) {
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
      default:
        throw new Error(`Unsupported LaTeX command: ${token.value} at position ${token.position}`);
    }
  }

  /**
   * Parse a fraction \\frac{numerator}{denominator}
   */
  private parseFraction(): Fraction {
    this.consume('LBRACE');
    const numerator = this.parseExpression();
    this.consume('RBRACE');

    this.consume('LBRACE');
    const denominator = this.parseExpression();
    this.consume('RBRACE');

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

    return left;
  }

  /**
   * Parse multiplication and division (including implicit multiplication)
   */
  private parseTerm(): ASTNode {
    let left = this.parseUnary();

    while (true) {
      // Explicit multiplication/division
      if (
        this.expectToken('OPERATOR') &&
        (this.currentToken.value === '*' || this.currentToken.value === '/')
      ) {
        const operator = this.currentToken.value as '*' | '/';
        this.advance();
        const right = this.parseUnary();

        left = {
          type: 'BinaryExpression',
          operator,
          left,
          right,
        };
      }
      // Implicit multiplication cases
      else if (this.isImplicitMultiplication()) {
        const right = this.parseUnary();

        left = {
          type: 'BinaryExpression',
          operator: '*',
          left,
          right,
        };
      } else {
        break;
      }
    }

    return left;
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

    return {
      ast: resolvedAST,
      error: null,
    };
  } catch (error) {
    return {
      ast: null,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
