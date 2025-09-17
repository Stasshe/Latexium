import typescript from 'rollup-plugin-typescript2';
import tslib from 'typescript';

const config = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      typescript: tslib,
      tsconfig: 'tsconfig.json',
    }),
  ],
  external: [],
};

export default config;
