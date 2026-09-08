import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 代码块样式服务
// ------------------------------------------------------------
// 功能：
//   1. 显示行号（codeBlockLineNumbers）：编辑模式代码块每行左侧显示行号。
//   2. 显示语言标签（codeBlockShowLang）：代码块右上角显示语言徽标。
//   3. 自定义圆角（codeBlockCustomRadius + codeBlockRadius）：
//      开关开启后按 codeBlockRadius（px）设置代码块圆角。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + 圆角值以 setCssProps
// 写入 body，不创建 <style> 元素（规避 obsidianmd 审核），规则本体在静态
// code-block.css。仅低频事件驱动（onLayoutReady / layout-change / window-open）。
// ============================================================

// 门控类
const CODE_BLOCK_LINE_NUMBERS_CLASS = "style-tweaker-code-block-line-numbers";
const CODE_BLOCK_SHOW_LANG_CLASS = "style-tweaker-code-block-show-lang";
const CODE_BLOCK_CUSTOM_RADIUS_CLASS = "style-tweaker-code-block-custom-radius";

// 圆角 CSS 变量
const CODE_BLOCK_RADIUS_VAR = "--style-tweaker-code-block-radius";

// 圆角有效范围（px）
const RADIUS_MIN = 4;
const RADIUS_MAX = 16;

export class EditorCodeBlockService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    const radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, s.codeBlockRadius ?? 8));
    doc.body.setCssProps({
      [CODE_BLOCK_RADIUS_VAR]: `${radius}px`,
    });

    doc.body.classList.toggle(
      CODE_BLOCK_LINE_NUMBERS_CLASS,
      s.codeBlockLineNumbers
    );
    doc.body.classList.toggle(CODE_BLOCK_SHOW_LANG_CLASS, s.codeBlockShowLang);
    doc.body.classList.toggle(CODE_BLOCK_CUSTOM_RADIUS_CLASS, s.codeBlockCustomRadius);
  }

  protected clearDocument(doc: Document): void {
    doc.body?.style.removeProperty(CODE_BLOCK_RADIUS_VAR);
    doc.body?.classList.remove(
      CODE_BLOCK_LINE_NUMBERS_CLASS,
      CODE_BLOCK_SHOW_LANG_CLASS,
      CODE_BLOCK_CUSTOM_RADIUS_CLASS
    );
  }
}
