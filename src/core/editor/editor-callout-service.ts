import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 编辑器标注样式服务
// ------------------------------------------------------------
// 功能：
//   1. 基础标注样式：callout 圆角变量、内容首/末子元素 margin 修正。
//     仅在选择了某种标注风格（非 default）时生效，default 时标注保持原生。
//   2. 标注风格（calloutStyle）：default / accent-bar / sleek / split /
//      outline / minimal / soft。
//   3. 自定义圆角（calloutCustomRadius + calloutRadius）：
//      开关开启后按 calloutRadius（px）设置圆角。
//
// 设计要点：基础样式随风格类门控（body[class*="style-tweaker-callout-style-"]）；
// 风格/圆角为门控类，圆角值以 setCssProps 写入 body，不创建 <style> 元素
// （规避 obsidianmd 审核），规则本体在静态 callout.css。
// 低频事件驱动，与编辑器其他样式服务同构。
// ============================================================

// 门控类
const CALLOUT_STYLE_CLASS_PREFIX = "style-tweaker-callout-style-";
const CALLOUT_CUSTOM_RADIUS_CLASS = "style-tweaker-callout-custom-radius";

// 圆角 CSS 变量
const CALLOUT_RADIUS_VAR = "--style-tweaker-callout-radius";

// 合法风格值（防止异常设置注入）
const VALID_STYLES = ["accent-bar", "sleek", "split", "outline", "minimal", "soft"];

// 圆角有效范围（px）
const RADIUS_MIN = 4;
const RADIUS_MAX = 16;

export class EditorCalloutService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    const radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, s.calloutRadius ?? 8));
    doc.body.setCssProps({
      [CALLOUT_RADIUS_VAR]: `${radius}px`,
    });

    const body = doc.body;

    // 先清除所有风格类，再按当前设置挂上
    for (const v of VALID_STYLES) {
      body.classList.remove(CALLOUT_STYLE_CLASS_PREFIX + v);
    }
    if (s.calloutStyle && VALID_STYLES.includes(s.calloutStyle)) {
      body.classList.add(CALLOUT_STYLE_CLASS_PREFIX + s.calloutStyle);
    }

    body.classList.toggle(CALLOUT_CUSTOM_RADIUS_CLASS, s.calloutCustomRadius);
  }

  protected clearDocument(doc: Document): void {
    doc.body?.style.removeProperty(CALLOUT_RADIUS_VAR);
    if (!doc?.body) return;
    const body = doc.body;
    for (const v of VALID_STYLES) {
      body.classList.remove(CALLOUT_STYLE_CLASS_PREFIX + v);
    }
    body.classList.remove(CALLOUT_CUSTOM_RADIUS_CLASS);
  }
}
