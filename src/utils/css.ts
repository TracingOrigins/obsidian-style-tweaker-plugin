/**
 * `css` 标签模板：把字符串标记为 CSS 内容。
 *
 * 作用：Prettier 会把 `css` 标签模板内的内容按 CSS 解析并格式化（缩进随 tabWidth: 4），
 * 使运行时注入的整份 CSS 与 src/styles/**\/*.css 保持同一排版标准，无需手工维护缩进。
 *
 * 运行时行为等同于普通模板字符串：String.raw 原样拼接，不转义、不做任何处理。
 */
export const css = String.raw;
