// ============================================================
// 逐文档 CSS 变量写入工具（用于规避 obsidianmd 审核的
// 「禁止创建并挂载 <style> 元素」：规则本体留在静态 styles.css，
// 动态值改为写 body 的内联 CSS 变量）。
// ------------------------------------------------------------
// setAccentVar 为「把色名解析成深浅主题各自 hex」的单文档落地：
//   - value 为 default/空 → 写 fallback（通常是 var(--color-accent)）
//   - 否则按该文档 body 的当前深浅主题解析对应 hex（theme-dark → 深色系）
// 深/浅切换时由调用方监听 css-change 重新 apply，以刷新此变量。
// setAccentVarPair 则是「色板下拉 + 自定义色」的变体：深浅两份一次写全，
// 由 CSS 按 body 主题取用，切换主题无需重算、也无需监听 css-change。
//
// 变量统一挂在 body 上（而非 :root/html）：Obsidian 主题变量（如 --color-accent）
// 定义在 body 的 theme-dark/theme-light 类上，挂在 body 才能正确解析引用；
// 挂 :root(html) 无法引用子元素 body 上的变量，会导致颜色整条失效。
// ============================================================

import { accentToHex, normalizeHexColor } from "./color-palette";

/**
 * 把「颜色设置值」解析后写入指定文档 body 上的 CSS 变量。
 * @param value     设置项值（色名 / #rrggbb 自定义色 / default / 空）
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
    // 自定义色（颜色选择器写入的 #rrggbb）是固定色，深浅主题通用，直接用。
    resolved = normalizeHexColor(name);
    if (!resolved) {
      const isDark = doc.body.classList.contains("theme-dark");
      resolved = accentToHex(name, isDark);
      // 深浅两表都无匹配（理论不发生）时回退
      if (!resolved) resolved = accentToHex(name, !isDark);
    }
  }
  doc.body.setCssProps({ [variable]: resolved ?? fallback });
}

/**
 * 「色板下拉 + 自定义色」组合值的双变量落地（深浅各写一份，无需监听 css-change）：
 *   - colorValue 为 default / 空 → 移除变量，由 CSS 回退 fallback
 *   - 其余色名 → 深浅两套 hex 分别写入 darkVar / lightVar
 *   - colorValue 为 "custom" 且 customValue 是合法 hex → 两处都写该固定色
 * CSS 侧按 body 的 theme-dark / theme-light 取用，形如：
 *   var(<darkVar>, var(--color-accent)) / var(<lightVar>, var(--color-accent))
 *
 * @param colorValue  色板下拉值（"default" / 色名 / "custom"）
 * @param customValue 自定义色字段值（仅 colorValue 为 custom 时参与解析）
 */
export function setAccentVarPair(
  doc: Document,
  colorValue: string | undefined,
  customValue: string | undefined,
  darkVar: string,
  lightVar: string,
): void {
  if (!doc?.body) return;
  const body = doc.body;
  const custom = normalizeHexColor(customValue);
  const useCustom = (colorValue ?? "").trim() === "custom" && !!custom;
  const dark = useCustom ? custom : accentToHex(colorValue, true);
  const light = useCustom ? custom : accentToHex(colorValue, false);
  if (dark && light) {
    body.style.setProperty(darkVar, dark);
    body.style.setProperty(lightVar, light);
  } else {
    body.style.removeProperty(darkVar);
    body.style.removeProperty(lightVar);
  }
}

/**
 * 百分比数值变量的落地（如不透明度）：
 *   - 写入 `<n>%`，超出 0-100 会被夹紧
 *   - 非法值 / undefined → 移除变量，由 CSS 回退默认百分比
 */
export function setPercentVar(
  doc: Document,
  value: number | undefined,
  variable: string,
): void {
  if (!doc?.body) return;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    doc.body.style.removeProperty(variable);
    return;
  }
  doc.body.style.setProperty(variable, `${Math.min(100, Math.max(0, n))}%`);
}

/** 移除指定文档 body 上的变量（对应 clearDocument）。 */
export function removeDocVar(doc: Document, variable: string): void {
  doc.body?.style.removeProperty(variable);
}
