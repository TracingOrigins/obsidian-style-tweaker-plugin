import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { MOCHA_ACCENTS, LATTE_ACCENTS } from "../../utils/color-palette";

// ============================================================
// 主题色服务：把设置中选中的 accent 覆盖到 Obsidian 全局强调色变量。
// ------------------------------------------------------------
// 深浅色分开取色：深色模式用 Mocha 系 accent，浅色模式用 Latte 系 accent。
// accent 色值表复用 color-palette.ts 中从 FLAVORS（AnuPpuccin）推导的单一数据源，
// 避免在此重复定义另一套、导致同一 accent 在不同功能下色值不一致。
// 通过 setCssProps 把深浅各自选中的色值写入 body（当前文档按其 body 深浅主题取一套），
// 主题切换经 css-change 事件重 apply，无需 MutationObserver，也不创建 <style>。
// 选 "default"（跟随原生）时不写入覆盖，沿用 Obsidian 原生强调色。
// ============================================================

/** 覆盖全局强调色所用的 Obsidian 变量名（深浅主题各写同一组）。 */
const ACCENT_VARS = [
  "--color-accent",
  "--color-accent-1",
  "--color-accent-2",
  "--text-accent",
  "--text-accent-hover",
  "--interactive-accent",
  "--interactive-accent-hover",
] as const;

/** 当前文档 body 是否深色主题。 */
function isDarkDoc(doc: Document): boolean {
  return doc.body?.classList.contains("theme-dark") ?? true;
}

/**
 * 主题色样式服务：按深浅色各自选中的 accent 覆盖全局强调色变量。
 */
export class ThemeColorService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  /** 主题切换时重 apply：深浅切换后按新主题选对应 accent 写入 body。 */
  protected registerExtraListeners(): void {
    this.plugin.registerEvent(
      this.app.workspace.on("css-change", () => this.apply()),
    );
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    // 深色主题色：用户选色（非 default）用 Mocha 系；default 时不覆盖、沿用 Obsidian 原生强调色。
    // 注意：纯色模式下也不回退到纯色 flavor 的 accent——纯色模式只改变中性色（背景/文字/边框），
    // accent 应保持「用户选择 or Obsidian 原生」，否则会冒出既非所选也非原生的第三种颜色。
    // 按当前文档深浅主题决定写哪一套；css-change 会在主题切换后刷新。
    const isDark = isDarkDoc(doc);
    const hex = isDark
      ? (MOCHA_ACCENTS[s.themeDark] ?? null)
      : (LATTE_ACCENTS[s.themeLight] ?? null);

    if (!hex) {
      // 当前主题下用户选的是 default / 无匹配：移除覆盖，恢复 Obsidian 原生强调色
      for (const v of ACCENT_VARS) doc.body.style.removeProperty(v);
      return;
    }

    const props = {} as Record<string, string>;
    for (const v of ACCENT_VARS) props[v] = hex;
    doc.body.setCssProps(props);
  }

  protected clearDocument(doc: Document): void {
    for (const v of ACCENT_VARS) {
      doc.body?.style.removeProperty(v);
    }
  }
}
