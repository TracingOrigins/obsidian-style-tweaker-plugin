// ============================================================
// 逐文档 CSS 变量写入工具（用于规避 obsidianmd 审核的
// 「禁止创建并挂载 <style> 元素」：规则本体留在静态 styles.css，
// 动态值改为写 body 的内联 CSS 变量）。
// ------------------------------------------------------------
// setAccentVar 为「把色名解析成深浅主题各自 hex」的单文档落地：
//   - value 为 default/空 → 写 fallback（通常是 var(--color-accent)）
//   - 否则按该文档 body 的当前深浅主题解析对应 hex（theme-dark → 深色系）
// 深/浅切换时由调用方监听 css-change 重新 apply，以刷新此变量。
//
// 变量统一挂在 body 上（而非 :root/html）：Obsidian 主题变量（如 --color-accent）
// 定义在 body 的 theme-dark/theme-light 类上，挂在 body 才能正确解析引用；
// 挂 :root(html) 无法引用子元素 body 上的变量，会导致颜色整条失效。
// ============================================================

import { accentToHex } from "./color-palette";

/**
 * 把「颜色设置值」解析后写入指定文档 body 上的 CSS 变量。
 * @param value     设置项值（色名 / default / 空）
 * @param variable  CSS 变量名（--xxx）
 * @param fallback  未指定 / 未知色名时的回退值（可为 var(--color-accent)）
 */
export function setAccentVar(
  doc: Document,
  value: string | undefined,
  variable: string,
  fallback: string,
): void {
  if (!doc?.body) return;
  const name = (value ?? "").trim();
  let resolved: string | null = null;
  if (name && name !== "default") {
    const isDark = doc.body.classList.contains("theme-dark");
    resolved = accentToHex(name, isDark);
    // 深浅两表都无匹配（理论不发生）时回退
    if (!resolved) resolved = accentToHex(name, !isDark);
  }
  doc.body.setCssProps({ [variable]: resolved ?? fallback });
}

/** 移除指定文档 body 上的变量（对应 clearDocument）。 */
export function removeDocVar(doc: Document, variable: string): void {
  doc.body?.style.removeProperty(variable);
}
