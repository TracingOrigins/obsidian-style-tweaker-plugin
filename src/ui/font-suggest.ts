import { AbstractInputSuggest, App, prepareFuzzySearch } from "obsidian";

/** 建议列表最多展示的条目数（系统字体可达上千，避免一次性渲染过多 DOM） */
const MAX_SUGGESTIONS = 100;

/**
 * 字体搜索建议：绑定到一个文本框，边输入边模糊匹配系统字体族名，选中后写回输入框。
 * 与 FolderSuggest 同构；字体列表由外部提供（getFonts 每次调用都取最新缓存，
 * 因此后台枚举出完整系统字体后，下一次输入即可看到）。
 * 输入不受列表限制：不在列表中的字体名仍可手动输入。
 */
export class FontSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private getFonts: () => string[],
    private onSelectFont: (family: string) => void,
  ) {
    super(app, inputEl);
    // 触发选择回调后由外部负责保存设置。
    // setValue 会改变输入框值并触发 AbstractInputSuggest 的 input 事件，
    // 导致建议框在 selectSuggestion 自动 close 之后又因新值重新打开。
    // 因此延迟到事件循环之后强制再 close 一次，确保建议框最终消失。
    this.onSelect((font) => {
      this.setValue(font);
      this.onSelectFont(font);
      window.setTimeout(() => this.close(), 0);
    });
  }

  getSuggestions(query: string): string[] {
    const fonts = this.getFonts();
    const queryLower = query.trim().toLowerCase();
    if (!queryLower) return fonts.slice(0, MAX_SUGGESTIONS);

    // 优先精确/前缀匹配，其次模糊匹配
    const fuzzy = prepareFuzzySearch(queryLower);
    const starts: string[] = [];
    const fuzzyMatches: string[] = [];
    for (const font of fonts) {
      const fontLower = font.toLowerCase();
      if (fontLower === queryLower || fontLower.startsWith(queryLower)) {
        starts.push(font);
      } else if (fuzzy(fontLower)) {
        fuzzyMatches.push(font);
      }
    }
    return [...starts, ...fuzzyMatches].slice(0, MAX_SUGGESTIONS);
  }

  renderSuggestion(font: string, el: HTMLElement): void {
    el.setText(font);
    // 用该字体自身渲染，直观预览效果（字体名多为拉丁字符，缺失字形时回退默认字体）
    el.style.fontFamily = `"${font.replace(/"/g, "")}"`;
  }
}
