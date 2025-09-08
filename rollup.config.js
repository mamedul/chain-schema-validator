import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// Check if the NODE_ENV is 'production'
const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'index.js',
  output: {
    // Dynamically set the filename
    file: isProduction ? 'dist/chain-schema-validator.umd.min.js' : 'dist/chain-schema-validator.umd.js',
    format: 'umd',
    name: 'chainSchemaValidator', 
  },
  plugins: [
    resolve(),
    commonjs(),
    
    // Only add terser() to the plugins array if isProduction is true
    isProduction && terser()
  ]
};