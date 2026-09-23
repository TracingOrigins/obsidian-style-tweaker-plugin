import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 引用块样式服务
// ------------------------------------------------------------
// 功能：
//   1. 引用块样式（blockquoteStyle）：default（Obsidian 原生）/ color-block（色块）/
//      quotation-mark（引号）/ bubble（气泡）/ frame（边框）。
//      注：引号样式用 quotation-mark 而非 quote——后者在 CSS 侧已被 .HyperMD-quote /
//      .cm-quote 用于指代「引用块」，用作样式值会产生同名不同义。
//   2. 自定义色块底色（blockquoteCustomBlockBackground + blockquoteBlockBackgroundColor）：
//      仅「色块」样式可用（其余样式背景透明）。关闭时移除变量，由 CSS 回退到固定的
//      text-muted 12% 中性灰；开启后写入色相，透明度固定 12% 由 CSS 侧负责。
//   3. 自定义边框颜色（blockquoteCustomBorder）：开启后左边线用所选色（「默认」即强调色）；
//      关闭时移除内联值并撤掉门控类，回到主题原生左边线。
//   4. 自定义文字颜色（blockquoteCustomText）：开启后文字用所选色（「默认」即强调色）；
//      关闭时撤掉门控类，--blockquote-color 未定义 → CSS 回退 var(--text-normal)。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-blockquote-color / --style-tweaker-blockquote-border-color），规则本体在静态
// blockquote.css；不创建 <style> 元素。颜色随深浅主题：当前文档按 body 主题解析 hex，
// 主题切换经 css-change 重 apply 刷新。
// ============================================================

// 样式门控类前缀（default 不挂任何类，即 Obsidian 原生 blockquote）
const BLOCKQUOTE_STYLE_CLASS_PREFIX = "style-tweaker-blockquote-";
// 自定义颜色门控类：文字与边框各自独立开关，故拆成两个类（原先是一个合并的 custom 类）
const BLOCKQUOTE_CUSTOM_TEXT_CLASS = "style-tweaker-blockquote-custom-text";
const BLOCKQUOTE_CUSTOM_BORDER_CLASS = "style-tweaker-blockquote-custom-border";

// 风格值清单（与 blockquote.css 的门控类一一对应；default 不挂类）
const BLOCKQUOTE_STYLES = ["color-block", "quotation-mark", "bubble", "frame"];

// 引用块 CSS 变量
const BLOCKQUOTE_COLOR_VAR = "--style-tweaker-blockquote-color";
const BLOCKQUOTE_BORDER_VAR = "--style-tweaker-blockquote-border-color";
const BLOCKQUOTE_BG_VAR = "--style-tweaker-blockquote-bg-color";

export class EditorBlockquoteService extends BaseService {
    constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
        super(plugin, getSettings);
    }

    /** 主题切换时重 apply，刷新随深浅色解析的变量。 */
    protected registerExtraListeners(): void {
        this.plugin.registerEvent(this.app.workspace.on("css-change", () => this.apply()));
    }

    protected applyToDocument(doc: Document): void {
        if (!doc?.body) return;
        const s = this.getSettings();

        // 文字色：仅在开启「自定义文字颜色」时写入变量并挂门控类。
        // 关闭时二者皆撤 → --blockquote-color 未定义 → CSS 回退 --text-normal（原生文字色）。
        // 选「默认」→ 写入 var(--color-accent)，即主题强调色。
        if (s.blockquoteCustomText) {
            setAccentVar(doc, s.blockquoteTextColor, BLOCKQUOTE_COLOR_VAR, "var(--color-accent)");
        } else {
            removeDocVar(doc, BLOCKQUOTE_COLOR_VAR);
        }

        // 边框色：仅在开启「自定义边框颜色」时写入。关闭时移除内联值并撤掉门控类，
        // 左边线回到主题原生色——否则用户先前选过的颜色会在关闭后继续生效。
        if (s.blockquoteCustomBorder) {
            setAccentVar(doc, s.blockquoteBorderColor, BLOCKQUOTE_BORDER_VAR, "var(--color-accent)");
        } else {
            removeDocVar(doc, BLOCKQUOTE_BORDER_VAR);
        }

        // 色块底色：仅在开启「自定义色块底色」时写入色相变量。
        //   未开启 → 移除变量，由 blockquote.css 回退到固定的 text-muted 12% 中性灰；
        //   开启且选「默认」→ 回退主题强调色（与文字色 / 边框色语义一致）。
        // 透明度固定 12%（写在 CSS 侧），只放开色相，避免挡住壁纸或过于刺眼。
        if (s.blockquoteCustomBlockBackground) {
            setAccentVar(doc, s.blockquoteBlockBackgroundColor, BLOCKQUOTE_BG_VAR, "var(--color-accent)");
        } else {
            removeDocVar(doc, BLOCKQUOTE_BG_VAR);
        }

        // 清除上一轮样式门控类，再挂当前样式类（default 不挂）
        for (const cls of BLOCKQUOTE_STYLES) {
            doc.body.classList.remove(BLOCKQUOTE_STYLE_CLASS_PREFIX + cls);
        }
        if (s.blockquoteStyle && s.blockquoteStyle !== "default") {
            doc.body.classList.add(BLOCKQUOTE_STYLE_CLASS_PREFIX + s.blockquoteStyle);
        }
        doc.body.classList.toggle(BLOCKQUOTE_CUSTOM_TEXT_CLASS, s.blockquoteCustomText);
        doc.body.classList.toggle(BLOCKQUOTE_CUSTOM_BORDER_CLASS, s.blockquoteCustomBorder);
    }

    protected clearDocument(doc: Document): void {
        removeDocVar(doc, BLOCKQUOTE_COLOR_VAR);
        removeDocVar(doc, BLOCKQUOTE_BORDER_VAR);
        removeDocVar(doc, BLOCKQUOTE_BG_VAR);
        if (doc.body) {
            for (const cls of BLOCKQUOTE_STYLES) {
                doc.body.classList.remove(BLOCKQUOTE_STYLE_CLASS_PREFIX + cls);
            }
            doc.body.classList.remove(BLOCKQUOTE_CUSTOM_TEXT_CLASS, BLOCKQUOTE_CUSTOM_BORDER_CLASS);
        }
    }
}
