import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// 活动标签强调色高亮门控类（见 tabs.css）。
// 命名带 style-tweaker-* 前缀以避免与其他插件类名冲突。
// 激活条件：仅由设置项 activeTabHighlight 决定，与背景无关。
const ICONS_HIGHLIGHT_CLASS = "style-tweaker-active-icon-highlight";

/**
 * 标签导航样式服务：活动标签高亮。
 *
 * 纯设置驱动的门控类：只在各窗口文档的 body 上挂/摘类，不注入 CSS 变量，
 * 不需要轮询或 MutationObserver。由基类统一管理事件驱动。
 */
export class TabBarService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    doc.body.classList.toggle(ICONS_HIGHLIGHT_CLASS, s.activeTabHighlight);
  }

  protected clearDocument(doc: Document): void {
    doc.body?.classList.remove(ICONS_HIGHLIGHT_CLASS);
  }
}
