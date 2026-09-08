import { AbstractInputSuggest, App, TFolder, prepareFuzzySearch } from "obsidian";

/**
 * 文件夹搜索建议：绑定到一个文本框，边输入边模糊匹配 vault 内的文件夹路径，
 * 供用户从下拉列表中选择。选中后会把完整路径写回输入框。
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private onSelectFolder: (path: string) => void,
  ) {
    super(app, inputEl);
    // 触发选择回调后由外部负责保存设置。
    // setValue 会改变输入框值并触发 AbstractInputSuggest 的 input 事件，
    // 导致建议框在 selectSuggestion 自动 close 之后又因新值重新打开。
    // 因此延迟到事件循环之后强制再 close 一次，确保建议框最终消失。
    this.onSelect((folder) => {
      this.setValue(folder.path);
      this.onSelectFolder(folder.path);
      window.setTimeout(() => this.close(), 0);
    });
  }

  getSuggestions(query: string): TFolder[] {
    const folders: TFolder[] = [];
    this.app.vault.getAllLoadedFiles().forEach((file) => {
      if (file instanceof TFolder && !file.isRoot()) folders.push(file);
    });
    // 按路径深度排序，让外层文件夹排在前面更易定位
    folders.sort((a, b) => a.path.length - b.path.length);

    const queryLower = query.trim().toLowerCase();
    if (!queryLower) return folders.slice(0, this.limit || 100);

    // 优先精确/前缀匹配，其次模糊匹配
    const fuzzy = prepareFuzzySearch(queryLower);
    const starts: TFolder[] = [];
    const fuzzyMatches: TFolder[] = [];
    for (const folder of folders) {
      const pathLower = folder.path.toLowerCase();
      if (pathLower === queryLower || pathLower.startsWith(queryLower)) {
        starts.push(folder);
      } else if (fuzzy(pathLower)) {
        fuzzyMatches.push(folder);
      }
    }
    return [...starts, ...fuzzyMatches].slice(0, this.limit || 100);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }
}
