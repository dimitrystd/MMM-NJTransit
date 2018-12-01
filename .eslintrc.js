module.exports = {
    parser: "babel-eslint",
    extends: [
        "airbnb",
        "plugin:flowtype/recommended",
        "plugin:jsx-a11y/recommended"
    ],
    plugins: [
        "flowtype",
        "react",
        "jsx-a11y",
        "import",
        "promise",
        "fp"
    ],
    rules: {
        "comma-dangle": ["error", "never"],
        "import/prefer-default-export": "off",
        "import/no-extraneous-dependencies": [
            "error",
            { devDependencies: true }
        ],
        indent: ["error", 4],
        "no-confusing-arrow": "off",
        "no-param-reassign": "off",
        "quote-props": ["error", "as-needed", { numbers: true }],
        quotes: [2, "double"],
        "space-before-function-paren": ["off", "never"],
        "fp/no-arguments": "error",
        "fp/no-delete": "error",
        "fp/no-mutating-methods": ["error", { allowedObjects: ["R", "EditorState"] }],
        "function-paren-newline": ["off", "never"],
        "object-curly-newline": ["off", "never"],
        "prefer-destructuring": ["error", {
            VariableDeclarator: {
                array: false,
                object: true
            },
            AssignmentExpression: {
                array: false,
                object: true
            }
        }, {
            enforceForRenamedProperties: false
        }],
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/mouse-events-have-key-events": "off",
        "jsx-a11y/no-static-element-interactions": "off",
        "promise/catch-or-return": "error",
        "react/jsx-boolean-value": "off",
        "react/jsx-filename-extension": "off",
        "react/jsx-indent": ["error", 4],
        "react/jsx-indent-props": ["error", 4],
        "react/no-unescaped-entities": "off",
        "react/prefer-stateless-function": "off",
        "react/require-default-props": "off"
    },
    env: {
        browser: true,
        commonjs: true,
        mocha: true
    },
    globals: {
        sinon: true,
        suite: true,
        benchmark: true,
        i18n: true
    }
};
