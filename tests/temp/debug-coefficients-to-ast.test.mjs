/**
 * Debug coefficient to AST conversion
 */

import { PolynomialUtils } from '../../dist/index.esm.js';

function debugCoefficientsToAST() {
  console.log('Debugging coefficientsToAST conversion...\n');

  // This should be x - 1, but might be coming out as x - -1
  const coeffs = [-1, 1]; // represents x - 1
  console.log('Coefficients:', coeffs);
  
  try {
    const polyUtils = new PolynomialUtils();
    const result = polyUtils.coefficientsToAST(coeffs, 'x');
    console.log('AST result:', JSON.stringify(result, null, 2));
    
    // Test with basic simplify
    import('../../dist/index.esm.js').then(module => {
      const { astToLatex } = module;
      console.log('LaTeX output:', astToLatex(result));
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCoefficientsToAST();