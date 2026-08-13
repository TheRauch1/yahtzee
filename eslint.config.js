import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	reactRefresh.configs.vite,
	prettier,
	{
		plugins: { 'react-hooks': reactHooks },
		rules: { ...reactHooks.configs.recommended.rules }
	},
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef rule
			// on TypeScript projects: https://typescript-eslint.io/troubleshooting/faqs/eslint/
			'no-undef': 'off'
		}
	},
	{
		// shadcn primitives pair a component with its cva() variants export in the
		// same file by convention; that's not a fast-refresh boundary violation.
		files: ['src/components/ui/**/*.tsx'],
		rules: { 'react-refresh/only-export-components': 'off' }
	}
);
