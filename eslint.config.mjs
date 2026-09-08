import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/scripts/**',
			'**/references/**',
			'esbuild.config.mjs',
			'eslint.config.mjs',
			'version-bump.mjs',
			'versions.json',
			'package.json',
			'main.js',
			'*.js',
		],
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.js', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	...obsidianmd.configs.recommended,
);
