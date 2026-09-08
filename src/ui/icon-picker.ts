import { App, SuggestModal, getIcon, getIconIds } from "obsidian";

import { t } from "../utils/i18n";

/**
 * 图标选择弹窗（SuggestModal 模式，参考 ImagePicker）：
 * 列出 Obsidian 运行时可用图标（getIconIds 返回 lucide 内置库 + 其它插件 addIcon 注册的图标），
 * 支持按名称搜索（前缀优先，其次包含匹配）。
 *
 * 说明：Obsidian 的 SuggestModal 未提供可靠的懒加载刷新接口，且内置的 .suggestion
 * 列表本身可滚动、对大量项有渲染优化，因此一次性返回全部图标即可流畅滚动查看所有。
 * 选中某个图标后，同时回调其名称与序列化后的 SVG 代码，由调用方决定存哪个。
 */
export class IconPicker extends SuggestModal<string> {
  constructor(
    app: App,
    private readonly onPick: (name: string, svg: string) => void,
  ) {
    super(app);
    // Obsidian 的 Suggest 默认只渲染前 limit 个建议项；放宽到全部图标数量，
    // 否则一次性返回全部也会被截断、看不到所有图标。
    this.limit = getIconIds().length;
    this.setPlaceholder(t("newtab.logo.code.searchPlaceholder"));
    this.setInstructions([
      { command: "↑↓", purpose: t("newtab.logo.code.nav") },
      { command: "↵", purpose: t("newtab.logo.code.choose") },
    ]);
  }

  getSuggestions(query: string): string[] {
    const icons = getIconIds();
    const q = query.trim().toLowerCase();
    if (!q) return icons;
    // 前缀匹配优先，其次包含匹配
    return icons.filter(
      (name) => name.startsWith(q) || name.includes(q),
    );
  }

  renderSuggestion(name: string, el: HTMLElement): void {
    el.addClass("style-tweaker-logo-suggestion");
    el.empty();

    const preview = el.createDiv({ cls: "style-tweaker-logo-suggestion-icon" });
    // getIcon 返回的即为 SVG 元素本身
    const icon = getIcon(name);
    if (icon) preview.appendChild(icon.cloneNode(true));

    const info = el.createDiv({ cls: "style-tweaker-logo-suggestion-name" });
    info.createDiv({ text: name });
  }

  onChooseSuggestion(name: string): void {
    // 同时回调图标名称与序列化后的 SVG 代码，由调用方决定存哪个：
    // - 内置图标徽标：存名称（name）
    // - 自定义 SVG 徽标：存 SVG 代码（svg）
    const icon = getIcon(name);
    const svg = icon ? icon.outerHTML : "";
    this.onPick(name, svg);
  }
}
