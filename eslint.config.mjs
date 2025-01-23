import chaiFriendly from "eslint-plugin-chai-friendly";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import airbnbConfig from "eslint-config-airbnb-base-extract/airbnb-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    ...airbnbConfig,
    {
        plugins: {
            "chai-friendly": chaiFriendly,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },

        rules: {
            "comma-dangle": 0,
            "consistent-return": 0,
            "function-paren-newline": ["error", "never"],
            "implicit-arrow-linebreak": ["off"],
            "no-param-reassign": 0,
            "no-underscore-dangle": 0,
            "no-shadow": 0,
            "no-console": 0,
            "no-plusplus": 0,
            "no-unused-expressions": 0,
            "no-unused-vars": ["error", { argsIgnorePattern: "next" }],
            "chai-friendly/no-unused-expressions": 2,
        },
    },
];
