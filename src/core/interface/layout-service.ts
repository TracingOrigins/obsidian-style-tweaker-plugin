import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// 整体布局门控类（见 workspace/layout.css）。
// 命名带 style-tweaker-* 前缀避免与其他插件类名冲突。
const BORDER_LAYOUT_CLASS = "style-tweaker-layout-border";
const CARDS_LAYOUT_CLASS = "style-tweaker-layout-cards";

/**
 * 整体布局服务。
 *
 * 依据设置 layoutMode 在 body 上挂对应门控类：
 *   - default → 不挂任何类（layout.css 整组失效，保持 Obsidian 默认布局）
 *   - border  → 挂 style-tweaker-layout-border（边框布局）
 *   - cards   → 挂 style-tweaker-layout-cards（卡片布局）
 *
 * 纯门控类驱动，不注入 CSS 变量，也不需要轮询/MutationObserver，
 * 由基类统一管理事件驱动。
 */
export class LayoutService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    const mode = s.layoutMode ?? "default";
    const cardsOn = mode === "cards";
    doc.body.classList.toggle(BORDER_LAYOUT_CLASS, mode === "border");
    doc.body.classList.toggle(CARDS_LAYOUT_CLASS, cardsOn);
  }

  protected clearDocument(doc: Document): void {
    doc.body?.classList.remove(BORDER_LAYOUT_CLASS, CARDS_LAYOUT_CLASS);
  }
}
