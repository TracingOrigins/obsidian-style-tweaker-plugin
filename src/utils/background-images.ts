import { type App, type TFile } from "obsidian";

// 受支持的图片文件扩展名，用于文件选择器过滤
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp"];

/**
 * 文件选择器过滤：仅允许图片扩展名，且（若设置了壁纸文件夹）仅限该文件夹内。
 * folder 为空表示扫描整个 vault。
 */
export function isSelectableImage(file: TFile, folder = ""): boolean {
  if (!IMAGE_EXTENSIONS.includes(file.extension.toLowerCase())) return false;
  const f = folder.trim();
  if (f && !file.path.toLowerCase().startsWith(f.toLowerCase() + "/")) return false;
  return true;
}

/**
 * 收集 vault 内可选图片并按完整路径排序。
 * 弹窗、前后切换按钮共用本函数，保证各处顺序一致。
 * @param extraFilter 额外过滤条件（默认仅按扩展名 + 文件夹过滤）
 */
export function getSortedBackgroundImages(
  app: App,
  folder = "",
  extraFilter?: (file: TFile) => boolean,
): TFile[] {
  return app.vault
    .getFiles()
    .filter((f) => isSelectableImage(f, folder))
    .filter((f) => (extraFilter ? extraFilter(f) : true))
    .sort((a, b) => a.path.localeCompare(b.path));
}
