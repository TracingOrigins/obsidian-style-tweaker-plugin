import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 分隔线样式服务
// ------------------------------------------------------------
// 功能：
//   1. 分隔线样式（hrStyle）：default（Obsidian 原生）/ icon（带中间图标）/ no-icon（无图标渐变）。
//   2. 中间图标（hrCenterIcon）：仅 icon 样式生效，支持 emoji 或字符。
//   3. 图标旋转（hrIconRotate）：仅 icon 样式生效，单位 deg。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + 以内联 CSS 变量方式
// 写入 body（--style-tweaker-hr-center-icon / --style-tweaker-hr-icon-rotate），
// 规则本体在静态 styles.css 中按门控类消费；不创建 <style> 元素，符合审核要求。
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询，避免卡死。
// ============================================================

// 门控类
const HR_ICON_CLASS = "style-tweaker-hr-icon";
const HR_NO_ICON_CLASS = "style-tweaker-hr-no-icon";

// 分隔线 CSS 变量
const HR_CENTER_ICON_VAR = "--style-tweaker-hr-center-icon";
const HR_ICON_ROTATE_VAR = "--style-tweaker-hr-icon-rotate";

export class EditorHrService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    // 变量值始终写入 body（default 时变量无消费者），规则本体在静态 hr.css；
    // 用 setCssProps 而非直接 style 赋值，避免 obsidianmd/no-static-styles-assignment。
    const icon = s.hrCenterIcon?.trim() ? s.hrCenterIcon : "⚡️";
    const rotate = `${Math.round(s.hrIconRotate ?? 0)}deg`;
    doc.body.setCssProps({
      [HR_CENTER_ICON_VAR]: `"${icon}"`,
      [HR_ICON_ROTATE_VAR]: rotate,
    });

    // "default" 不挂任何门控类（即 Obsidian 原生 hr）；
    // "icon" / "no-icon" 分别挂对应门控类。
    doc.body.classList.toggle(HR_ICON_CLASS, s.hrStyle === "icon");
    doc.body.classList.toggle(HR_NO_ICON_CLASS, s.hrStyle === "no-icon");
  }

  protected clearDocument(doc: Document): void {
    // 移除 body 上注入的变量（与旧 removeStyle 对应）
    doc.body?.style.removeProperty(HR_CENTER_ICON_VAR);
    doc.body?.style.removeProperty(HR_ICON_ROTATE_VAR);
    doc.body?.classList.remove(HR_ICON_CLASS, HR_NO_ICON_CLASS);
  }
}
