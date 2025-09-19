/**
 * Finite Field Operations for Berlekamp-Zassenhaus Algorithm
 * Implements modular arithmetic and polynomial operations in finite fields
 */

/**
 * Modular arithmetic utilities
 */
export class ModularArithmetic {
  /**
   * Compute (a + b) mod p
   */
  static add(a: number, b: number, p: number): number {
    return (((a + b) % p) + p) % p;
  }

  /**
   * Compute (a - b) mod p
   */
  static subtract(a: number, b: number, p: number): number {
    return (((a - b) % p) + p) % p;
  }

  /**
   * Compute (a * b) mod p
   */
  static multiply(a: number, b: number, p: number): number {
    return (((a * b) % p) + p) % p;
  }

  /**
   * Compute a^exp mod p using binary exponentiation
   */
  static power(a: number, exp: number, p: number): number {
    if (exp === 0) return 1;
    if (exp === 1) return ((a % p) + p) % p;

    let result = 1;
    let base = ((a % p) + p) % p;
    let exponent = exp;

    while (exponent > 0) {
      if (exponent % 2 === 1) {
        result = this.multiply(result, base, p);
      }
      base = this.multiply(base, base, p);
      exponent = Math.floor(exponent / 2);
    }

    return result;
  }

  /**
   * Compute modular inverse of a mod p using extended Euclidean algorithm
   * Returns null if inverse doesn't exist
   */
  static inverse(a: number, p: number): number | null {
    const [gcd, x] = this.extendedGcd(a, p);
    if (gcd !== 1) return null;
    return ((x % p) + p) % p;
  }

  /**
   * Extended Euclidean algorithm
   * Returns [gcd(a, b), x, y] where ax + by = gcd(a, b)
   */
  static extendedGcd(a: number, b: number): [number, number, number] {
    if (b === 0) return [a, 1, 0];

    const [gcd, x1, y1] = this.extendedGcd(b, a % b);
    const x = y1;
    const y = x1 - Math.floor(a / b) * y1;

    return [gcd, x, y];
  }

  /**
   * Check if a number is prime (simple trial division)
   */
  static isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;

    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }
}

/**
 * Polynomial operations in finite fields
 */
export class FiniteFieldPolynomial {
  constructor(
    public coefficients: number[],
    public prime: number
  ) {
    // Normalize coefficients to be in range [0, prime)
    this.coefficients = coefficients.map(c => ((c % prime) + prime) % prime);
    this.removeLeadingZeros();
  }

  /**
   * Remove leading zero coefficients
   */
  private removeLeadingZeros(): void {
    while (this.coefficients.length > 1 && this.coefficients[this.coefficients.length - 1] === 0) {
      this.coefficients.pop();
    }
  }

  /**
   * Get the degree of the polynomial
   */
  get degree(): number {
    return this.coefficients.length - 1;
  }

  /**
   * Check if polynomial is zero
   */
  get isZero(): boolean {
    return this.coefficients.length === 1 && this.coefficients[0] === 0;
  }

  /**
   * Add two polynomials in finite field
   */
  add(other: FiniteFieldPolynomial): FiniteFieldPolynomial {
    if (this.prime !== other.prime) {
      throw new Error('Cannot add polynomials with different primes');
    }

    const maxLength = Math.max(this.coefficients.length, other.coefficients.length);
    const result: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const a = this.coefficients[i] || 0;
      const b = other.coefficients[i] || 0;
      result.push(ModularArithmetic.add(a, b, this.prime));
    }

    return new FiniteFieldPolynomial(result, this.prime);
  }

  /**
   * Subtract two polynomials in finite field
   */
  subtract(other: FiniteFieldPolynomial): FiniteFieldPolynomial {
    if (this.prime !== other.prime) {
      throw new Error('Cannot subtract polynomials with different primes');
    }

    const maxLength = Math.max(this.coefficients.length, other.coefficients.length);
    const result: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const a = this.coefficients[i] || 0;
      const b = other.coefficients[i] || 0;
      result.push(ModularArithmetic.subtract(a, b, this.prime));
    }

    return new FiniteFieldPolynomial(result, this.prime);
  }

  /**
   * Multiply two polynomials in finite field
   */
  multiply(other: FiniteFieldPolynomial): FiniteFieldPolynomial {
    if (this.prime !== other.prime) {
      throw new Error('Cannot multiply polynomials with different primes');
    }

    if (this.isZero || other.isZero) {
      return new FiniteFieldPolynomial([0], this.prime);
    }

    const resultDegree = this.degree + other.degree;
    const result = new Array(resultDegree + 1).fill(0);

    for (let i = 0; i < this.coefficients.length; i++) {
      for (let j = 0; j < other.coefficients.length; j++) {
        const coeff = ModularArithmetic.multiply(
          this.coefficients[i] || 0,
          other.coefficients[j] || 0,
          this.prime
        );
        result[i + j] = ModularArithmetic.add(result[i + j] || 0, coeff, this.prime);
      }
    }

    return new FiniteFieldPolynomial(result, this.prime);
  }

  /**
   * Compute polynomial division with remainder
   * Returns [quotient, remainder]
   */
  divmod(divisor: FiniteFieldPolynomial): [FiniteFieldPolynomial, FiniteFieldPolynomial] {
    if (this.prime !== divisor.prime) {
      throw new Error('Cannot divide polynomials with different primes');
    }

    if (divisor.isZero) {
      throw new Error('Division by zero polynomial');
    }

    const remainder = new FiniteFieldPolynomial([...this.coefficients], this.prime);
    const quotientCoeffs: number[] = [];

    const divisorLeadCoeff = Number(divisor.coefficients[divisor.degree]);
    const divisorLeadInverse = ModularArithmetic.inverse(divisorLeadCoeff, this.prime);

    if (divisorLeadInverse === null) {
      throw new Error('Leading coefficient is not invertible');
    }

    while (remainder.degree >= divisor.degree && !remainder.isZero) {
      const leadCoeff = Number(remainder.coefficients[remainder.degree]);
      const quotCoeff = ModularArithmetic.multiply(leadCoeff, divisorLeadInverse, this.prime);
      const degreeDiff = remainder.degree - divisor.degree;

      // Set quotient coefficient
      while (quotientCoeffs.length <= degreeDiff) {
        quotientCoeffs.push(0);
      }
      quotientCoeffs[degreeDiff] = quotCoeff;

      // Subtract divisor * quotCoeff * x^degreeDiff from remainder
      for (let i = 0; i <= divisor.degree; i++) {
        const pos = i + degreeDiff;
        if (pos < remainder.coefficients.length) {
          const subtrahend = ModularArithmetic.multiply(
            divisor.coefficients[i] || 0,
            quotCoeff,
            this.prime
          );
          remainder.coefficients[pos] = ModularArithmetic.subtract(
            remainder.coefficients[pos] || 0,
            subtrahend,
            this.prime
          );
        }
      }

      remainder.removeLeadingZeros();
    }

    const quotient = new FiniteFieldPolynomial(quotientCoeffs.reverse(), this.prime);
    return [quotient, remainder];
  }

  /**
   * Compute GCD of two polynomials using Euclidean algorithm
   */
  gcd(other: FiniteFieldPolynomial): FiniteFieldPolynomial {
    if (this.prime !== other.prime) {
      throw new Error('Cannot compute GCD of polynomials with different primes');
    }

    let a = new FiniteFieldPolynomial([...this.coefficients], this.prime);
    let b = new FiniteFieldPolynomial([...other.coefficients], this.prime);

    while (!b.isZero) {
      const [, remainder] = a.divmod(b);
      a = b;
      b = remainder;
    }

    // Make monic (leading coefficient = 1)
    if (!a.isZero) {
      const leadCoeff = Number(a.coefficients[a.degree]);
      const leadInverse = ModularArithmetic.inverse(leadCoeff, this.prime);
      if (leadInverse !== null) {
        const newCoeffs = a.coefficients.map(c =>
          ModularArithmetic.multiply(c, leadInverse, this.prime)
        );
        return new FiniteFieldPolynomial(newCoeffs, this.prime);
      }
    }

    return a;
  }

  /**
   * Evaluate polynomial at a given point
   */
  evaluate(x: number): number {
    let result = 0;
    let power = 1;

    for (const coeff of this.coefficients) {
      result = ModularArithmetic.add(
        result,
        ModularArithmetic.multiply(coeff, power, this.prime),
        this.prime
      );
      power = ModularArithmetic.multiply(power, x, this.prime);
    }

    return result;
  }

  /**
   * Create a copy of the polynomial
   */
  clone(): FiniteFieldPolynomial {
    return new FiniteFieldPolynomial([...this.coefficients], this.prime);
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    if (this.isZero) return '0';

    const terms: string[] = [];
    for (let i = this.degree; i >= 0; i--) {
      const coeff = Number(this.coefficients[i]);
      if (coeff === 0) continue;

      let term = '';
      if (i === 0) {
        term = coeff.toString();
      } else if (i === 1) {
        term = coeff === 1 ? 'x' : `${coeff}x`;
      } else {
        term = coeff === 1 ? `x^${i}` : `${coeff}x^${i}`;
      }

      terms.push(term);
    }

    return terms.join(' + ');
  }
}
