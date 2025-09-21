---
#### Factorization Process (Mermaid)
```mermaid
flowchart TD
    A[Input: AST node, variable, preferences] --> B[Deep clone AST, init context, steps]
    B --> C[Push 'Starting factorization' to steps]
    C --> D{Iteration < maxIterations?}
    D -- No --> Z1[Push 'Max iterations reached', go to RecursiveSub]
    D -- Yes --> E[For each registered strategy]
    E --> F{strategy.canApply currentNode, context?}
    F -- No --> E
    F -- Yes --> G[Push 'Attempting strategy.name' to steps]
    G --> H[strategy.apply currentNode, context]
    H --> I{result.success & result.changed?}
    I -- No --> J[Push fail reason to steps, try next strategy]
    I -- Yes --> K[Update currentNode = result.ast, hasChanged = true, iterationChanged = true]
    K --> L[Push result.steps to totalSteps]
    L --> M[Try LaTeX conversion, push to steps]
    M --> D
    J --> E
    D -- After all strategies, if !iterationChanged --> N[Push 'No further factorization possible', break]
    N --> RecursiveSub

    %% Recursive factorization of subexpressions
    RecursiveSub[Recursively factor subexpressions]
    RecursiveSub --> O{Node type}
    O -- BinaryExpression --> P[Recurse left/right, apply factor to each if * or +]
    O -- UnaryExpression --> Q[Recurse operand]
    O -- FunctionCall --> R[Recurse all args]
    O -- Others --> S[Return node as is]
    P --> T[Push subfactor steps to context.steps]
    Q --> S
    R --> S
    S --> U[Return final AST, steps, changed]
```
example:
```mermaid
    F1[PatternRecognitionStrategy] --> F2[findPattern node]
    F2 --> F3{Pattern found?}
    F3 -- Yes --> F4[pattern.factor node → new AST]
    F3 -- No --> F5[Return unchanged]
    F4 --> F6[Push pattern name to steps]
    F6 --> F7[Return changed AST, steps]

    G1[CommonFactorStrategy] --> G2[Extract terms, coefficients, variables]
    G2 --> G3[Find numeric GCD, common variables]
    G3 --> G4{Any common factor?}
    G4 -- Yes --> G5[Build factored AST, push steps]
    G4 -- No --> G6[Return unchanged]

    H1[DifferenceOfSquaresStrategy] --> H2[Check a^2 - b^2 form]
    H2 --> H3{Match?}
    H3 -- Yes --> H4[Build, push steps]
    H3 -- No --> H5[Return unchanged]

    I1[BerlekampZassenhausStrategy] --> I2[Check polynomial degree, not already factored]
    I2 --> I3{Degree >= 2?}
    I3 -- Yes --> I4[berlekampZassenhausFactor]
    I4 --> I5{Factors found?}
    I5 -- Yes --> I6[Build product AST, push steps]
    I5 -- No --> I7[Return unchanged]

    J1[LLLFactorizationStrategy] --> J2[Check degree >= 3, not already factored]
    J2 --> J3[lllFactor]
    J3 --> J4{Factors found?}
    J4 -- Yes --> J5[Build product AST, push steps]
    J4 -- No --> J6[Return unchanged]

    K1[PowerSubstitutionStrategy] --> K2[Detect x^<nk> + ... form]
    K2 --> K3{Can substitute t = x^k?}
    K3 -- Yes --> K4[Factor as poly in t, back-substitute, push steps]
    K3 -- No --> K5[Return unchanged]

    L1[PerfectPowerStrategy] --> L2[Detect <ax+b>^k expansion]
    L2 --> L3{Match?}
    L3 -- Yes --> L4[Build AST, push steps]
    L3 -- No --> L5[Return unchanged]

    M1[GroupingStrategy] --> M2[Extract 4+ terms, try groupings]
    M2 --> M3{Grouping yields factorization?}
    M3 -- Yes --> M4[Build grouped AST, push steps]
    M3 -- No --> M5[Return unchanged]
```

```mermaid
flowchart TD
    A[Input: LaTeX string] --> B[Tokenizer: Split into tokens]
    B --> C{Any token error?}
    C -- Yes --> Z1[Return error]
    C -- No --> D[Parser: Build AST]
    D --> E[Scope resolution: resolveScopeInAST]
    E --> F[Recursively convert '/' to Fraction nodes]
    F --> G[Return ParseResult]
    G --> H{analyze called?}
    H -- No --> Z2[Return AST only]
    H -- Yes --> I[analyze ast, options]
    I --> J{options.task}
    J -- evaluate --> K1[analyzeEvaluate: Calculate value]
    J -- approx --> K2[analyzeApprox: Calculate approximate value]
    J -- differentiate --> K3[analyzeDifferentiate: Auto variable detection → Differentiate → Record steps]
    J -- integrate --> K4[analyzeIntegrate: Integrate with IntegrationEngine]
    J -- solve --> K5[analyzeSolve: Judge equation degree → Solve]
    J -- factor --> K6[analyzeFactorization: Factorization → Record steps]
    J -- distribute --> K7[analyzeDistribution: Expand → Combine like terms]
    J -- analyze-polynomial --> K8[analyzePolynomial: Analyze polynomial structure]
    J -- others --> K9[Return not implemented error]
    K1 --> L[Return AnalyzeResult]
    K2 --> L
    K3 --> L
    K4 --> L
    K5 --> L
    K6 --> L
    K7 --> L
    K8 --> L
    K9 --> L
    L --> M[Output: Result / Steps / Error]

    %% Error return nodes
    Z1[ParseResult: Return error]
    Z2[ParseResult: Return AST only]
```