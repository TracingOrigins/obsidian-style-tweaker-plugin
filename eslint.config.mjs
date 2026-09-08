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
	// 本插件通过运行时动态注入 <style> 与背景层实现"设置即时生效"，
	// 这是动态样式插件的必要手段，需关闭以下不适用于此场景的规则。
	// 放在 recommended 之后，确保覆盖其默认配置。
	{
		rules: {
			'obsidianmd/no-forbidden-elements': 'off',
			'obsidianmd/no-static-styles-assignment': 'off',
		},
	},
);
