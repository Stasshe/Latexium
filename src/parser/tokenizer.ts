/**
 * LaTeX Tokenizer
 * Tokenizes LaTeX mathematical expressions into a stream of tokens
 */

export type TokenType =
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMAND'
  | 'UNDERSCORE'
  | 'CARET'
  | 'COMMA'
  | 'FACTORIAL'
  | 'WHITESPACE'
  | 'EOF'
  | 'ERROR';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class LaTeXTokenizer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = this.input[0] || null;
  }

  /**
   * Advance to the next character
   */
  private advance(): void {
    this.position++;
    this.currentChar =
      this.position < this.input.length ? (this.input[this.position] ?? null) : null;
  }

  /**
   * Peek at the next character without advancing
   */
  private peek(): string | null {
    const peekPos = this.position + 1;
    return peekPos < this.input.length ? (this.input[peekPos] ?? null) : null;
  }

  /**
   * Skip whitespace characters
   */
  private skipWhitespace(): void {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  /**
   * Read a number (integer or decimal)
   */
  private readNumber(): string {
    let result = '';
    while (this.currentChar && /[0-9.]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  /**
   * Read an identifier (variable name)
   * For mathematical expressions, we treat each single letter as a separate variable
   * to enable proper implicit multiplication (e.g., "xx" becomes "x * x")
   */
  private readIdentifier(): string {
    if (this.currentChar && /[a-zA-Z]/.test(this.currentChar)) {
      // Read only one character for single-letter variables to enable implicit multiplication
      const result = this.currentChar;
      this.advance();
      return result;
    }

    // For multi-character identifiers starting with underscore or special cases
    let result = '';
    while (this.currentChar && /[a-zA-Z_]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  /**
   * Read a LaTeX command starting with backslash
   */
  private readCommand(): string {
    let result = '\\';
    this.advance(); // Skip the backslash

    while (this.currentChar && /[a-zA-Z]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  /**
   * Get the next token from the input
   */
  public nextToken(): Token {
    while (this.currentChar) {
      const position = this.position;

      // Skip whitespace
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // Numbers
      if (/[0-9]/.test(this.currentChar)) {
        return {
          type: 'NUMBER',
          value: this.readNumber(),
          position,
        };
      }

      // LaTeX commands
      if (this.currentChar === '\\') {
        const command = this.readCommand();
        switch (command) {
          case '\\cdot':
            return { type: 'OPERATOR', value: '*', position };
          case '\\times':
            return { type: 'OPERATOR', value: '*', position };
          case '\\div':
            return { type: 'OPERATOR', value: '/', position };
          case '\\star':
            return { type: 'OPERATOR', value: '*', position };
          case '\\ast':
            return { type: 'OPERATOR', value: '*', position };
          default:
            return { type: 'COMMAND', value: command, position };
        }
      }

      // Single character tokens
      switch (this.currentChar) {
        case '(':
          this.advance();
          return { type: 'LPAREN', value: '(', position };
        case ')':
          this.advance();
          return { type: 'RPAREN', value: ')', position };
        case '{':
          this.advance();
          return { type: 'LBRACE', value: '{', position };
        case '}':
          this.advance();
          return { type: 'RBRACE', value: '}', position };
        case '[':
          this.advance();
          return { type: 'LBRACKET', value: '[', position };
        case ']':
          this.advance();
          return { type: 'RBRACKET', value: ']', position };
        case '_':
          this.advance();
          return { type: 'UNDERSCORE', value: '_', position };
        case '^':
          this.advance();
          return { type: 'CARET', value: '^', position };
        case ',':
          this.advance();
          return { type: 'COMMA', value: ',', position };
        case '!':
          this.advance();
          return { type: 'FACTORIAL', value: '\\factorial', position };
        case '+':
        case '-':
        case '*':
        case '/':
        case '=':
        case '>':
        case '<': {
          const op = this.currentChar;
          this.advance();
          // Handle >= and <=
          if ((op === '>' || op === '<') && this.currentChar === '=') {
            const extendedOp = op + this.currentChar;
            this.advance();
            return { type: 'OPERATOR', value: extendedOp, position };
          }
          return { type: 'OPERATOR', value: op, position };
        }
      }

      // Identifiers (variables, function names)
      if (/[a-zA-Z_]/.test(this.currentChar)) {
        return {
          type: 'IDENTIFIER',
          value: this.readIdentifier(),
          position,
        };
      }

      // Greek letters and special symbols - handle π as identifier
      if (/[π∞∅]/.test(this.currentChar)) {
        const symbol = this.currentChar;
        this.advance();
        return { type: 'IDENTIFIER', value: symbol, position };
      }

      // Unknown character - return error token
      const unknownChar = this.currentChar;
      this.advance();
      return {
        type: 'ERROR',
        value: unknownChar,
        position,
      };
    }

    // End of input
    return {
      type: 'EOF',
      value: '',
      position: this.position,
    };
  }

  /**
   * Tokenize the entire input into an array of tokens
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];
    let token: Token;

    do {
      token = this.nextToken();
      tokens.push(token);
    } while (token.type !== 'EOF');

    return tokens;
  }
}
