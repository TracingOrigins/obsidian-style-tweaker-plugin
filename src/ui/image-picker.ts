import { App, SuggestModal, TFile } from "obsidian";

import { t } from "../utils/i18n";
import { getSortedBackgroundImages } from "../utils/background-images";

/**
 * 图片选择弹窗：搜索 vault 内（可受壁纸文件夹限制）的图片，
 * 每项左侧显示缩略图，右侧上方为图片名称、下方为路径。
 * folder 非空时直接按该文件夹过滤（与设置面板预览同一图池），
 * 避免先全库扫描再过滤导致的部分文件夹图片因全库路径排序靠后而显示不全。
 */
export class ImagePicker extends SuggestModal<TFile> {
  constructor(
    app: App,
    private isSelectable: (file: TFile) => boolean,
    private onChooseImage: (path: string) => void,
    /** 当前已设置的图片路径，用于在列表中高亮显示 */
    private currentPath = "",
    /** 当前字段是否移动端背景（决定缩略图用竖屏比例，与设置面板预览保持一致） */
    private isMobileField = false,
    /** 可选的壁纸文件夹：非空时仅列出该文件夹内的图片 */
    private folder = "",
    /** 是否以 1:1 正方形显示缩略图（徽标图片为 true，壁纸为 false） */
    private isSquare = false,
    /** 是否为紧凑方形（移动端徽标用小尺寸方形，桌面端徽标保持标准方形） */
    private isCompact = false,
  ) {
    super(app);
    this.setPlaceholder(t("common.image.modal.placeholder"));
    this.setInstructions([{ command: "↑↓", purpose: t("common.image.modal.nav") }, { command: "↵", purpose: t("common.image.modal.choose") }]);
  }

  getSuggestions(query: string): TFile[] {
    // folder 非空时直接按文件夹取图池（与「前后切换」按钮、设置面板预览同一排序），
    // folder 为空时退化为"全库 + filter"过滤。
    const images = this.folder.trim()
      ? getSortedBackgroundImages(this.app, this.folder)
      : getSortedBackgroundImages(this.app, "", this.isSelectable);

    const queryLower = query.trim().toLowerCase();
    if (!queryLower) return images.slice(0, this.limit || 100);

    // 优先按文件路径前缀匹配，其次按名称/路径模糊匹配
    const starts: TFile[] = [];
    const contains: TFile[] = [];
    for (const img of images) {
      const nameLower = img.basename.toLowerCase();
      const pathLower = img.path.toLowerCase();
      if (nameLower.startsWith(queryLower) || pathLower.startsWith(queryLower)) {
        starts.push(img);
      } else if (nameLower.includes(queryLower) || pathLower.includes(queryLower)) {
        contains.push(img);
      }
    }
    return [...starts, ...contains].slice(0, this.limit || 100);
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.addClass("style-tweaker-image-suggestion");
    // 当前已设置的图片项加高亮
    if (this.currentPath && file.path === this.currentPath) {
      el.addClass("is-current");
    }
    el.empty();

    // 移动端背景字段用竖屏缩略图，与设置面板预览比例一致（桌面字段保持横屏）；
    // 徽标图片（isSquare）用 1:1 正方形缩略图（移动端徽标 isCompact 用更小的方形）。
    const thumb = el.createDiv({
      cls:
        "style-tweaker-image-suggestion-thumb" +
        (this.isMobileField ? " is-mobile-field" : "") +
        (this.isSquare ? " is-square" : "") +
        (this.isCompact ? " is-compact" : ""),
    });
    const img = thumb.createEl("img");
    img.src = this.app.vault.getResourcePath(file);
    img.alt = file.name;

    const info = el.createDiv({ cls: "style-tweaker-image-suggestion-info" });
    info.createDiv({ cls: "style-tweaker-image-suggestion-name", text: file.basename });
    info.createDiv({ cls: "style-tweaker-image-suggestion-path", text: file.path });
  }

  onChooseSuggestion(file: TFile): void {
    this.onChooseImage(file.path);
  }
}
