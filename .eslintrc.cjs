module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  root: true,
  // parser: 'espree',
  // ignorePatterns: ['*.yaml'],

  plugins: [
    '@typescript-eslint/eslint-plugin',
    '@html-eslint',
    'eslint-plugin-tsdoc',
    'only-warn',
  ],
  // all files will get eslint recommended and prettier rules
  extends: [
    'eslint:recommended',
    'plugin:eslint-comments/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  rules: {
    /**
     * Next two rules came from Obsidian default eslint config
     */
    'no-prototype-builtins': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    /**
     * The rest are from me
     */
    'no-inline-comments': 'error', // 'error', 'warn' or 'off'
    'eslint-comments/disable-enable-pair': 'off',
    'eslint-comments/no-unused-disable': 'error',
    'eslint-comments/require-description': [
      'warn',
      {
        // below all the ignore options have been listed
        ignore: [
          // 'eslint',
          // 'eslint-disable',
          // 'eslint-disable-line',
          // 'eslint-disable-next-line',
          // 'eslint-enable',
          // 'eslint-env',
          // 'exported',
          // 'global',
          // 'globals',
        ],
      },
    ],
    'prettier/prettier': 'warn',

    // AST node names: https://github.com/eslint/eslint-visitor-keys/blob/main/lib/visitor-keys.js
    // AST Explorer: https://astexplorer.net/
    // AST Selectors: https://eslint.org/docs/latest/extend/selectors
    // 'no-restricted-syntax': [
    //   'warn',
    //   {
    //     // selector allows for only sync methods like existsSync... the rest should use node:fs/promises
    //     selector:
    //       'ImportDeclaration[source.value=/^node:fs$/] > ImportSpecifier[imported.name!=/^(existsSync|readdirSync|Dirent|OpenDirOptions|rmdirSync|appendFileSync|statSync|createWriteStream|createReadStream|PathLike)$/]',
    //     message: 'Import from node:fs/promises instead of node:fs.',
    //   },
    // ],
  },
  overrides: [
    // typescript files (and other js files in src directory)
    {
      files: ['*.[jt]s', '*.[jt]sx', '*.cjs'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      settings: {
        // 'import/parsers': {
        //   '@typescript-eslint/parser': ['.ts', '.tsx'],
        // },
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      rules: {
        'tsdoc/syntax': 'warn',
        // allowing the prettier plugin to handle this as a consistent best practice (eslint will still show the warnings on prettier's behalf)
        '@typescript-eslint/no-floating-promises': [
          'error',
          {
            ignoreIIFE: true,
          },
        ],
        'camelcase': 'off',
        // https://typescript-eslint.io/rules/naming-convention
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/naming-convention.md
        '@typescript-eslint/naming-convention': [
          'warn',
          {
            selector: 'default',
            // strictCamelCase does not allow consecutive capitals: 'myPrimaryID' must be 'myPrimaryId'
            format: ['strictCamelCase'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'forbid',
            filter: {
              regex: 'URL|DB|CSP|API|OS',
              match: false,
            },
          },
          {
            selector: 'import',
            format: ['strictCamelCase', 'PascalCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          // allow UPPER_CASE for constants
          {
            selector: ['variable'],
            modifiers: ['const'],
            format: ['strictCamelCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'forbid',
          },
          {
            selector: 'classProperty',
            format: ['strictCamelCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow', // or 'forbid'
            trailingUnderscore: 'forbid',
          },
          // allow PascalCase for exported constants
          {
            selector: ['variable'],
            modifiers: ['exported', 'const'],
            format: ['UPPER_CASE', 'PascalCase', 'strictCamelCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          // // allow PascalCase for SolidJS components
          // {
          //   selector: ['variable', 'function'],
          //   types: ['function'],
          //   format: ['PascalCase', 'camelCase'],
          //   leadingUnderscore: 'allow',
          // },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
            leadingUnderscore: 'allow',
          },
          // typescript generic parameters must start with a T
          {
            selector: 'typeParameter',
            format: ['PascalCase'],
            prefix: ['T'],
          },
          // allow certain exceptions like _id property for Realm primary keys
          {
            selector: ['property', 'variable'],
            format: null,
            filter: {
              regex: '^_id$|^_SERIALIZED$|^Authorization$|^[a-z_]+$',
              match: true,
            },
          },

          // Ignore properties that require quotes
          {
            selector: [
              'classProperty',
              'objectLiteralProperty',
              'typeProperty',
              'classMethod',
              'objectLiteralMethod',
              'typeMethod',
              'accessor',
              'enumMember',
            ],
            format: null,
            modifiers: ['requiresQuotes'],
          },

          /*
            below are examples not using but want to show possibilities of this rule
          */

          // // require certain prefixes for booleans
          // {
          //   selector: ['variable', 'property', 'parameterProperty', 'parameter'],
          //   types: ['boolean'],
          //   format: ['PascalCase'],
          //   prefix: ['b', 'is', 'has', 'flag'],
          //   // ignore UPPER_CASE which represents constants
          //   filter: {
          //     regex: '^[A-Z]+_?[A-Z_0-9]+$',
          //     match: false,
          //   },
          // },

          // // Enforce that interface names do NOT begin with an I
          // {
          //   selector: 'interface',
          //   format: ['PascalCase'],
          //   custom: {
          //     regex: '^I[A-Z]',
          //     match: false,
          //   },
          // },
        ],
        'no-useless-constructor': 'off',
        // '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/no-useless-constructor': 'off',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/no-require-imports': 'warn',
        'eqeqeq': ['error', 'always'],
        'default-case': 'error',
        'default-case-last': 'error',
        'sort-imports': [
          'off',
          {
            ignoreCase: true,
            ignoreDeclarationSort: false,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'],
            allowSeparatedGroups: true,
          },
        ],
        'spaced-comment': [
          'warn',
          'always',
          {
            line: { exceptions: [], markers: ['/'] },
            block: { exceptions: [], markers: ['/'], balanced: true },
          },
        ],
        'import/no-cycle': 'error',
        'prefer-destructuring': [
          'warn',
          {
            AssignmentExpression: {
              array: false,
              object: true,
            },
            VariableDeclarator: {
              array: false,
              object: true,
            },
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            disallowTypeAnnotations: true,
            /** weird issue where when I had this as 'inline-type-imports' it started crashing eslint
             * even though I hadn't touched this setting in months
             */
            fixStyle: 'separate-type-imports',
          },
        ],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/consistent-indexed-object-style': [
          'off',
          'index-signature', // 'record' is the default
        ],
        '@typescript-eslint/sort-type-constituents': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            vars: 'all',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
            caughtErrors: 'none',
          },
        ],
        '@typescript-eslint/prefer-for-of': 'warn',
        'guard-for-in': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        'prefer-object-has-own': 'warn',
        'no-prototype-builtins': 'warn',
        '@typescript-eslint/ban-types': [
          'warn',
          {
            extendDefaults: true,
            types: {
              // allow for empty object type {}
              // most notably for: (string & {}) hack for partial autocomplete
              '{}': false,

              // example of banning custom type
              'FooBarTest': {
                message: [
                  'Use Foo instead.',
                  'Example bulleted list:',
                  '- This is only a test.',
                  '- Testing out multi-line custom message.',
                  '- That is all...',
                  '',
                ].join('\n'),
                suggest: ['Foo', 'FooBar', 'FooBarTestFix'],
                fixWith: 'FooBarTestFix',
              },
            },
          },
        ],

        // TODO: enable these later
        // '@typescript-eslint/prefer-optional-chain': 'warn',
        // '@typescript-eslint/prefer-readonly': 'warn',

        // 'import/no-unresolved': [
        //   'error',
        //   {
        //     caseSensitive: false,
        //   },
        // ],

        // 'sort-keys': 'error',
        // "no-console": "warn",
        // 'quotes': ['error', 'backtick'], // TODO: enforce backticks

        'prettier/prettier': 'warn',
      },

      // nested override
      overrides: [
        {
          // disable type checking for files that are NOT typescript and NOT in src directory
          files: ['!src/**/*{.ts,.tsx}'],
          extends: ['plugin:@typescript-eslint/disable-type-checked'],
          rules: {
            camelcase: [
              'error',
              {
                properties: 'always',
                ignoreDestructuring: false,
                ignoreImports: false,
                ignoreGlobals: false,
              },
            ],

            // add for in/of loop rules later
          },
        },
        {
          files: ['*{.ts,.tsx,.js,.jsx,.cjs}'],
          rules: {
            'no-restricted-imports': 'off',
            '@typescript-eslint/no-restricted-imports': [
              'warn',
              {
                // paths: [
                //   // enforce use of node: and /promises versions of fs and path
                //   {
                //     name: 'fs',
                //     message: 'Use node:fs instead.',
                //     allowTypeImports: false,
                //   },
                //   {
                //     name: 'path',
                //     message: 'Use node:path instead.',
                //     allowTypeImports: false,
                //   },
                // ],
                // patterns: [
                //   // TODO: review later. This prevents component imports as well which we need
                //   // prevent importing entire modules with * and instead use { named } imports
                //   // {
                //   //   group: ['*'],
                //   //   importNames: ['default'],
                //   //   message:
                //   //     'Import named exports via destructuring instead of using default * to import everything.',
                //   // },
                //   {
                //     // restricts direct importing of third party libraries to only main/libs/*
                //     // TODO: need to add other libraries to this list. Just here for demonstration purposes for now
                //     group: ['node:fs', 'node:fs/*', 'node:path', 'node:path/*'],
                //     message:
                //       'Use src/main/libs/* abstractions instead of direct library.',
                //     allowTypeImports: false,
                //   },
                // ],
              },
            ],
            // // TODO: Could not figure this one out. will revisit later
            // 'import/no-restricted-paths': [
            //   'error',
            //   {
            //     zones: [
            //       {
            //         target: ['./**/src/renderer/**/*', './**/renderer/**/*'],
            //         from: ['./**/main/libs/**/*', '@main/libs/**/*', './**/libs/**/*'],
            //         // except: ['*/src/renderer/testMe.ts'],
            //         message: 'Use abstractions instead.',
            //       },
            //     ],
            //   },
            // ],
          },
          overrides: [
            {
              // rules for root config files and library import files (have to repeat rules as override replaces them all)
              files: [
                // 'forge.config.ts',
                'vite*.config.ts',
                // 'src/**/main/libs/**/*{.ts,.tsx,.js,.jsx,.cjs}',
                '.config/**/*.*',
              ],
              rules: {
                'no-restricted-imports': 'off',
                '@typescript-eslint/no-restricted-imports': [
                  'warn',
                  {
                    // paths: [
                    //   // enforce use of node: and /promises versions of fs and path
                    //   {
                    //     name: 'fs',
                    //     message: 'Use node:fs instead.',
                    //     allowTypeImports: false,
                    //   },
                    //   {
                    //     name: 'path',
                    //     message: 'Use node:path instead.',
                    //     allowTypeImports: false,
                    //   },
                    // ],
                    // patterns: [
                    //   {
                    //     group: ['**/libs/path', '@libs/path'],
                    //     message:
                    //       'Do NOT use lib abstractions from within config files or other lib abstractions.',
                    //     allowTypeImports: false,
                    //   },
                    // ],
                  },
                ],
              },
            },
          ],
        },
        // {
        //   // disable (or customize) rules specifically on the frontend in the renderer directory (and subdirectories)
        //   files: ['src/renderer/**/*{.ts,.tsx}'],
        //   rules: {
        //     // TODO: in the future maybe able to filter down even further to just tsx component files
        //     '@typescript-eslint/no-non-null-assertion': 'off',
        //   },
        // },
      ],
    },

    // overrides for dotfiles (typically config files) and vite config
    {
      files: ['.*.[jt]s', '.*.cjs', 'vite*.config.ts', '.config/**/*.*'],
      rules: {
        'no-inline-comments': 'off', // allow inline comments in config files
      },
    },

    // json files: https://ota-meshi.github.io/eslint-plugin-jsonc/user-guide
    {
      files: ['*.json', '*.json[5c]'],
      parser: 'jsonc-eslint-parser',
      extends: [
        'plugin:jsonc/recommended-with-json',
        'plugin:jsonc/recommended-with-jsonc',
        'plugin:jsonc/recommended-with-json5',
        'plugin:jsonc/prettier',
        'plugin:prettier/recommended',
      ],
      rules: {
        'jsonc/no-comments': 'off',
        'jsonc/key-name-casing': [
          'error',
          {
            'camelCase': true,
            'PascalCase': false,
            'SCREAMING_SNAKE_CASE': false,
            'kebab-case': false,
            'snake_case': false,
            'ignores': ['^[a-z][a-zA-Z]*:[a-z][a-zA-Z:]*$', '^@.*$'],
          },
        ],
        'jsonc/sort-keys': [
          'off',
          {
            pathPattern: '^.*$', // ^$ top level | ^.*$ all levels
            order: {
              type: 'asc',
              caseSensitive: false,
              natural: false,
            },
            minKeys: 5, // if less than 5 props, sort is not required
            allowLineSeparatedGroups: true, // bank line restarts sort
          },
        ],
        'prettier/prettier': 'warn', // show prettier formatting as warnings to help learn prettier
      },
      overrides: [
        // allow comments in certain JSON files like tsconfig.json
        {
          files: ['tsconfig.json'],
          rules: {
            'jsonc/no-comments': 'off',
            'no-inline-comments': 'off',
          },
        },
        // ignore certain rules for package.json
        {
          files: ['package.json', 'versions.json'],
          rules: {
            'jsonc/key-name-casing': 'off',
          },
        },
      ],
    },

    // yaml files: https://ota-meshi.github.io/eslint-plugin-yml/user-guide/#installation
    {
      files: ['*.yaml', '*.yml'],
      parser: 'yaml-eslint-parser',
      extends: ['plugin:yml/standard', 'plugin:yml/prettier'],
      rules: {
        'prettier/prettier': 'warn',
      },
    },

    // markdown files
    {
      files: ['*.md', '*.mdx'],
      excludedFiles: [],
      // mdx/recommended will utilize .remarkrc.cjs for linting
      extends: ['plugin:mdx/recommended'],
      settings: {
        // optional, if you want to lint code blocks within markdown files
        'mdx/code-blocks': true,
      },
      rules: {
        // 'mdx/remark': 'error', // default md rules will be warnings
        'prettier/prettier': 'warn',
      },
      overrides: [
        {
          files: ['README.md'],
          settings: {
            'mdx/code-blocks': false,
          },
          rules: {
            // rule overrides for README.md
          },
        },
      ],
    },
    // override code blocks in markdown files
    {
      files: [
        '**/*.md/*.js', // special "virtual" glob pattern for code inside md files
        '**/*.md/*.jsx',
        '**/*.md/*.ts',
        '**/*.md/*.tsx',
        '**/*.mdx/*.js',
        '**/*.mdx/*.jsx',
        '**/*.mdx/*.ts',
        '**/*.mdx/*.tsx',
      ],
      rules: {
        'no-inline-comments': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'import/no-unresolved': 'off',
      },
    },

    // html files: https://github.com/yeonjuan/html-eslint
    {
      files: ['*.html'],
      parser: '@html-eslint/parser',
      extends: ['plugin:@html-eslint/recommended'],
      rules: {
        'no-inline-comments': 'off',
        '@html-eslint/indent': ['error', 2],
        '@html-eslint/no-extra-spacing-attrs': 'off',
        '@html-eslint/require-closing-tags': 'off',
        'prettier/prettier': 'warn', // show prettier formatting as warnings to help learn prettier
      },
    },

    // css files (ignoring as doesn't seem like any good parser for css to work with eslint)
    // {
    //   files: ['*.css'],
    //   // parser: '@typescript-eslint/parser',
    //   extends: [
    //     'plugin:prettier/recommended',
    //     'prettier',
    //   ],
    //   rules: {
    //     'prettier/prettier': 'warn',
    //   },
    // },
  ],
};
