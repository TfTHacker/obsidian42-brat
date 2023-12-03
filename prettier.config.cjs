// eslint-disable-next-line tsdoc/syntax -- ignore for prettier config
/** @type {import("prettier").Config} */
const config = {
  plugins: [
    // // sorts consistently class names in tailwindcss
    // 'prettier-plugin-tailwindcss',
  ],
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 90,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: false,
  proseWrap: 'preserve',
  quoteProps: 'consistent',
  singleAttributePerLine: false,
  experimentalTernaries: true,
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'html',
      },
    },
    {
      files: '*.css',
      options: {
        parser: 'css',
      },
    },
  ],
};

module.exports = config;
