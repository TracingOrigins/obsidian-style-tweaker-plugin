import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// 状态栏样式门控类（见 interface/status-bar.css）
const STATUSBAR_FLOATING_CLASS = "style-tweaker-statusbar-floating";
const STATUSBAR_FIXED_CLASS = "style-tweaker-statusbar-fixed";

/**
 * 状态栏样式服务。
 *
 * 依据设置 statusBarStyle 在 body 上挂对应门控类：
 *   - default  → 不挂任何类（保持 Obsidian 默认状态栏）
 *   - floating → 挂 style-tweaker-statusbar-floating（悬浮状态栏）
 *   - fixed    → 挂 style-tweaker-statusbar-fixed（固定状态栏）
 *
 * 纯门控类驱动，不注入 CSS 变量，由基类统一管理事件驱动。
 */
export class StatusBarService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    const style = s.statusBarStyle ?? "default";
    doc.body.classList.toggle(STATUSBAR_FLOATING_CLASS, style === "floating");
    doc.body.classList.toggle(STATUSBAR_FIXED_CLASS, style === "fixed");
  }

  protected clearDocument(doc: Document): void {
    doc.body?.classList.remove(STATUSBAR_FLOATING_CLASS, STATUSBAR_FIXED_CLASS);
  }
}
