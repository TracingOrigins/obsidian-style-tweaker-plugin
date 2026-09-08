// ============================================================
// 样式服务注册表：统一实例化并循环驱动所有样式服务
// ============================================================
// main.ts 只需持有本注册表，通过 enableAll/applyAll/disableAll 驱动全部服务，
// 不再逐个实例化与调用。新增服务只需在下方数组追加一行。
import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../types/settings";
import type { StyleService } from "../types/service";
import { BackgroundService } from "./appearance/background-service";
import { ThemeColorService } from "./appearance/theme-color-service";
import { ThemeFlavorService } from "./appearance/theme-flavor-service";
import { TabBarService } from "./interface/tabbar-service";
import { SidebarMobileService } from "./interface/sidebar-mobile-service";
import { SidebarDesktopService, SidebarVaultNameService } from "./interface/sidebar-desktop-service";
import { LayoutService } from "./interface/layout-service";
import { LeftRightSpaceService } from "./interface/left-right-space-service";
import { StatusBarService } from "./interface/statusbar-service";
import { EditorBackgroundService } from "./editor/editor-background-service";
import { EditorActiveLineService } from "./editor/editor-active-line-service";
import { EditorInlineTitleService } from "./editor/editor-inline-title-service";
import { EditorPropertiesService } from "./editor/editor-properties-service";
import { EditorHeadingService } from "./editor/editor-heading-service";
import { EditorTextDecorationService } from "./editor/editor-text-decoration-service";
import { EditorInlineCodeService } from "./editor/editor-inline-code-service";
import { EditorCodeBlockService } from "./editor/editor-code-block-service";
import { EditorHrService } from "./editor/editor-hr-service";
import { EditorBlockquoteService } from "./editor/editor-blockquote-service";
import { EditorLinkService } from "./editor/editor-link-service";
import { EditorEmbedService } from "./editor/editor-embed-service";
import { EditorTableService } from "./editor/editor-table-service";
import { EditorCalloutService } from "./editor/editor-callout-service";
import { EditorListService } from "./editor/editor-list-service";
import { EditorTagService } from "./editor/editor-tag-service";
import { FileExplorerService } from "./plugin/file-explorer-service";
import { RecentFilesService } from "./plugin/recent-files-service";
import { NewTabService } from "./newtab/newtab-service";

export class StyleServiceRegistry {
  readonly services: StyleService[];
  private readonly backgroundService: BackgroundService;

  constructor(
    private readonly plugin: Plugin,
    private readonly getSettings: () => StyleTweakerSettings,
  ) {
    const legacySidebar = new SidebarDesktopService(this.plugin);
    this.backgroundService = new BackgroundService(this.plugin, this.getSettings);
    this.services = [
      // 界面背景服务：启用状态由其内部 apply() 依据 backgroundType / 是否解析出真实图片自判。
      this.backgroundService,
      // 主题色服务：按深浅色选中的 accent 覆盖全局强调色变量（深色系 / 浅色系）。
      new ThemeColorService(this.plugin, this.getSettings),
      // 主题风味服务：始终注入默认 flavor 变量（深=mocha / 浅=latte），供 border/cards 布局使用。
      new ThemeFlavorService(this.plugin, this.getSettings),
      // 标签导航（活动标签高亮 / 活动标签指示线）：纯门控类，与背景解耦。
      new TabBarService(this.plugin, this.getSettings),
      // 整体布局（边框 / 卡片）：纯门控类，default 不挂任何类。
      new LayoutService(this.plugin, this.getSettings),
      // 左右空间标记：边框/卡片布局 + 对应侧 dock 关闭时，给左右 workspace-tabs
      // 打 mod-middle-*-space / mod-bottom-*-space 类（供布局 CSS 消费）。
      new LeftRightSpaceService(this.plugin, this.getSettings),
      // 状态栏样式：依据 statusBarStyle 挂悬浮/固定门控类，default 不挂任何类。
      new StatusBarService(this.plugin, this.getSettings),
      // 移动端抽屉内容区块置顶：纯门控类，仅移动端（is-mobile）生效。
      new SidebarMobileService(this.plugin, this.getSettings),
      // 桌面端侧栏库名显示（自定义库名 / 文件列表顶部库名）：纯门控类 + 注入库名变量。
      new SidebarVaultNameService(this.plugin, this.getSettings),
      // 传统侧栏（legacy，桌面端）：apply(enabled) 带参数，用内联适配器对齐统一接口。
      {
        enable: () => legacySidebar.enable(),
        disable: () => legacySidebar.disable(),
        apply: () => legacySidebar.apply(this.getSettings().restoreLegacySidebar),
      },
      new EditorBackgroundService(this.plugin, this.getSettings),
      new EditorActiveLineService(this.plugin, this.getSettings),
      new EditorInlineTitleService(this.plugin, this.getSettings),
      new EditorPropertiesService(this.plugin, this.getSettings),
      new EditorHeadingService(this.plugin, this.getSettings),
      new EditorTextDecorationService(this.plugin, this.getSettings),
      new EditorInlineCodeService(this.plugin, this.getSettings),
      new EditorCodeBlockService(this.plugin, this.getSettings),
      new EditorHrService(this.plugin, this.getSettings),
      new EditorBlockquoteService(this.plugin, this.getSettings),
      new EditorLinkService(this.plugin, this.getSettings),
      new EditorEmbedService(this.plugin, this.getSettings),
      new EditorTableService(this.plugin, this.getSettings),
      new EditorCalloutService(this.plugin, this.getSettings),
      new EditorListService(this.plugin, this.getSettings),
      new EditorTagService(this.plugin, this.getSettings),
      new FileExplorerService(this.plugin, this.getSettings),
      // 社区插件 Recent Files：文件图标 + 彩色化（独立门控 style-tweaker-rf-*）
      new RecentFilesService(this.plugin, this.getSettings),
      // 新标签页：空标签页注入徽标 + 标题 + 粒子特效
      new NewTabService(this.plugin, this.getSettings),
    ];
  }

  enableAll(): void {
    for (const svc of this.services) svc.enable();
  }

  applyAll(): void {
    for (const svc of this.services) svc.apply();
  }

  disableAll(): void {
    for (const svc of this.services) svc.disable();
  }

  /** 获取界面背景服务（用于注册壁纸切换命令）。 */
  getBackgroundService(): BackgroundService {
    return this.backgroundService;
  }
}
