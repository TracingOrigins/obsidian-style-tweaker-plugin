import { Plugin } from "obsidian";
import { StyleTweakerSettings, DEFAULT_SETTINGS } from "./types/settings";
import { StyleTweakerSettingTab } from "./settings/setting-tab";
import { StyleServiceRegistry } from "./core";
import { t } from "./utils/i18n";

// ============================================================
// Plugin（薄控制器）
// ============================================================
// 所有样式服务（背景/侧栏/编辑器/文件浏览器）均由 StyleServiceRegistry 统一
// 实例化与循环驱动，本文件只负责插件生命周期与设置持久化，不感知具体服务。
export default class StyleTweakerPlugin extends Plugin {
  settings: StyleTweakerSettings = DEFAULT_SETTINGS;
  private registry!: StyleServiceRegistry;

  async onload(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...((await this.loadData()) as Partial<StyleTweakerSettings>),
    };
    this.registry = new StyleServiceRegistry(this, () => this.settings);
    this.registry.enableAll();

    await this.applyStyles();

    // 壁纸自动切换命令（上一个 / 下一个 / 搜索）
    this.registerWallpaperCommands();

    // 设置面板
    this.addSettingTab(new StyleTweakerSettingTab(this.app, this));
  }

  private registerWallpaperCommands(): void {
    const bg = this.registry.getBackgroundService();
    this.addCommand({
      id: "wallpaper-next",
      name: t("command.wallpaper.next"),
      callback: () => bg.nextWallpaper(),
    });
    this.addCommand({
      id: "wallpaper-prev",
      name: t("command.wallpaper.prev"),
      callback: () => bg.prevWallpaper(),
    });
    this.addCommand({
      id: "wallpaper-random",
      name: t("command.wallpaper.random"),
      callback: () => bg.randomWallpaper(),
    });
    this.addCommand({
      id: "wallpaper-search",
      name: t("command.wallpaper.search"),
      callback: () => bg.openWallpaperSearch(),
    });
  }

  onunload(): void {
    // 全量清理注入的 <style> 与监听器，恢复默认外观
    this.registry.disableAll();
  }

  // 唯一的"生效"入口：所有设置变更都汇聚到这里
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings); // 1. 持久化
    await this.applyStyles(); // 2. 重新注入 / 移除样式
  }

  // ---- 样式应用 ----

  private async applyStyles(): Promise<void> {
    this.registry.applyAll();

    // 通知 Obsidian 刷新 CSS（注入变量后主动触发 'css-change'，
    // 确保原生样式与第三方片段及时重算，避免依赖被动轮询）。
    this.app.workspace.trigger("css-change", { source: "style-tweaker" });
  }
}
