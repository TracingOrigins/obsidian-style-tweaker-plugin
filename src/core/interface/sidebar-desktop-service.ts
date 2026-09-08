import { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { accentToHex } from "../../utils/color-palette";

// ============================================================
// 桌面端侧栏：传统布局（legacy）+ 库名显示
// ============================================================
// 采用「移动 DOM + 样式」的混合方案：
//   - 把整个 .workspace-sidedock-vault-profile 节点【移动】到左侧 ribbon 容器底部
//     （ribbonSettingEl）。移动的是原生节点，其全部原生事件（左键/右键/悬浮）随之保留，
//     且因为是 DOM 移动而非 CSS 绝对定位（right:100% 会引发 reflow 闪烁），所以无闪烁。
//   - 移动后用 CSS 把该 profile 绝对定位到左侧 ribbon 槽位（position:absolute; right:100%;
//     bottom:0; writing-mode:vertical-lr; width:var(--ribbon-width)），确保位置精确、
//     垂直排列、不被其它 ribbon 按钮横向挤压。
//   - 原生 vault 按钮的新版下拉箭头图标 + 库名文本，用 CSS 隐藏并注入传统 vault SVG 图标。
//   - enable 幂等；disable 把节点还原回原 profile 位置并移除样式，无任何残留。

const TRADITIONAL_ICON_CSS = `
  /* 移动到左侧 ribbon 后的 vault profile：采用自然 flex 纵向布局，
     三个按钮（切库/帮助/设置）在 ribbon 容器内自上而下排列、靠左居中，
     不使用 position:absolute（避免 right:100% 在移动后上下文里错位）。
     统一用注入的标记类 .style-tweaker-legacy-profile 作为前缀。 */
  body:not(.is-mobile) .style-tweaker-legacy-profile {
    display: flex !important;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
  }
  body:not(.is-mobile) .style-tweaker-legacy-profile .workspace-drawer-vault-switcher {
    margin: 0;
  }
  body:not(.is-mobile) .style-tweaker-legacy-profile .workspace-drawer-vault-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px !important;
    margin: 0;
  }
  /* 隐藏新版下拉箭头图标与库名文本，仅注入传统 SVG 仓库图标 */
  body:not(.is-mobile) .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon > svg,
  body:not(.is-mobile) .style-tweaker-legacy-profile .workspace-drawer-vault-name {
    display: none !important;
  }
  body:not(.is-mobile).theme-light .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon::before,
  body:not(.is-mobile).theme-light .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon:hover::before,
  body:not(.is-mobile).theme-dark .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon::before,
  body:not(.is-mobile).theme-dark .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon:hover::before {
    content: "";
    display: inline-block;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 18px;
    height: 18px;
    opacity: 0.85;
    transition: opacity 150ms ease;
  }
  body:not(.is-mobile).theme-light .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon::before,
  body:not(.is-mobile).theme-light .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon:hover::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%235c5c5c' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round' class='svg-icon vault'%3E%3Cpath d='M21 19.2L21 4.8C21 3.47452 20.6046 3 19.5 3L4.5 3C3.39543 3 3 3.47452 3 4.8L3 19.2C3 20.5255 3.39543 21 4.5 21L19.5 21C20.6046 21 21 20.5255 21 19.2Z'%3E%3C/path%3E%3Cpath d='M14.9675 10.56C15.0601 11.1841 14.9535 11.8216 14.6629 12.3817C14.3722 12.9418 13.9124 13.396 13.3488 13.6797C12.7851 13.9634 12.1464 14.0621 11.5234 13.9619C10.9004 13.8616 10.3249 13.5675 9.87868 13.1213C9.43249 12.6751 9.13835 12.0996 9.0381 11.4766C8.93786 10.8536 9.0366 10.2149 9.3203 9.65123C9.60399 9.08759 10.0582 8.62776 10.6183 8.33713C11.1784 8.04651 11.8159 7.93989 12.4401 8.03245C13.0767 8.12687 13.6662 8.42355 14.1213 8.87868C14.5765 9.33381 14.8731 9.92326 14.9675 10.56Z'%3E%3C/path%3E%3Cpath d='M12 14L12 17'%3E%3C/path%3E%3Cpath d='M21 7L22.5 7'%3E%3C/path%3E%3Cpath d='M21 16L22.5 16'%3E%3C/path%3E%3C/svg%3E");
  }
  body:not(.is-mobile).theme-dark .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon::before,
  body:not(.is-mobile).theme-dark .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon:hover::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b3b3b3' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round' class='svg-icon vault'%3E%3Cpath d='M21 19.2L21 4.8C21 3.47452 20.6046 3 19.5 3L4.5 3C3.39543 3 3 3.47452 3 4.8L3 19.2C3 20.5255 3.39543 21 4.5 21L19.5 21C20.6046 21 21 20.5255 21 19.2Z'%3E%3C/path%3E%3Cpath d='M14.9675 10.56C15.0601 11.1841 14.9535 11.8216 14.6629 12.3817C14.3722 12.9418 13.9124 13.396 13.3488 13.6797C12.7851 13.9634 12.1464 14.0621 11.5234 13.9619C10.9004 13.8616 10.3249 13.5675 9.87868 13.1213C9.43249 12.6751 9.13835 12.0996 9.0381 11.4766C8.93786 10.8536 9.0366 10.2149 9.3203 9.65123C9.60399 9.08759 10.0582 8.62776 10.6183 8.33713C11.1784 8.04651 11.8159 7.93989 12.4401 8.03245C13.0767 8.12687 13.6662 8.42355 14.1213 8.87868C14.5765 9.33381 14.8731 9.92326 14.9675 10.56Z'%3E%3C/path%3E%3Cpath d='M12 14L12 17'%3E%3C/path%3E%3Cpath d='M21 7L22.5 7'%3E%3C/path%3E%3Cpath d='M21 16L22.5 16'%3E%3C/path%3E%3C/svg%3E");
  }
  /* 悬浮时仅提升不透明度作为反馈（保持 vault 图标，不切换为另一张图，避免空白） */
  body:not(.is-mobile) .style-tweaker-legacy-profile .workspace-drawer-vault-switcher-icon:hover::before {
    opacity: 1;
  }
`;

export class SidebarDesktopService {
  private movedProfile: HTMLElement | null = null;
  private originalParent: HTMLElement | null = null;
  private originalNext: Node | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private retryTimer: number | null = null;

  constructor(_plugin: Plugin) {
    // 保留构造签名以兼容调用方；当前实现直接查询 DOM，无需保存 app 实例
  }

  /** 根据当前设置应用/移除传统布局 */
  apply(enabled: boolean): void {
    if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable(): void {
    // 已移动且仍连接：仅确保样式注入即可（幂等）
    if (this.movedProfile && this.movedProfile.isConnected) {
      this.injectStyle();
      return;
    }
    this.movedProfile = null;

    const profile = document.querySelector<HTMLElement>(
      ".workspace-sidedock-vault-profile",
    );
    // 从 DOM 直接定位左侧 ribbon 容器（类型定义未暴露字段，故用选择器，最稳妥）。
    const ribbonEl = this.findLeftRibbon();

    // 布局尚未就绪（极少数时序场景）：延迟重试，避免重复挂计时器
    if (!ribbonEl || !profile) {
      if (this.retryTimer === null) {
        this.retryTimer = window.setTimeout(() => {
          this.retryTimer = null;
          this.enable();
        }, 250);
      }
      return;
    }

    // 记录原始位置，便于关闭时精确还原（避免 Obsidian 重建 DOM 导致引用失效）
    this.originalParent = profile.parentElement;
    this.originalNext = profile.nextSibling;

    // 把整个原生 profile（含切库/帮助/设置按钮及其全部事件）移动到左侧 ribbon 底部。
    // 移动的是原生节点，原生交互 100% 保留；且是 DOM 移动而非 CSS right:100% 绝对定位，无闪烁。
    this.movedProfile = profile;
    profile.classList.add("style-tweaker-legacy-profile");
    ribbonEl.appendChild(profile);

    // 给切库图标补上 clickable-icon 类：获得 Obsidian 标准图标按钮的 flex 基线与尺寸，
    // 避免绝对定位容器内宽度计算异常导致图标偏移。
    const switcherIcon = profile.querySelector<HTMLElement>(
      ".workspace-drawer-vault-switcher-icon",
    );
    if (switcherIcon) switcherIcon.classList.add("clickable-icon");

    this.injectStyle();
  }

  /**
   * 定位左侧 ribbon 容器。候选选择器按优先级从新到旧尝试，
   * 目标是把库名 profile 移动到左侧 ribbon 底部（传统 vault 图标槽位）。
   */
  private findLeftRibbon(): HTMLElement | null {
    const candidates = [
      ".workspace-ribbon.side-dock-ribbon",
      ".workspace-ribbon",
    ];
    for (const selector of candidates) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  disable(): void {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    // 把 profile 精确还原回原始父节点与相邻位置
    if (this.movedProfile && this.movedProfile.isConnected) {
      // 还原前移除临时添加的类，避免影响原生布局
      this.movedProfile.classList.remove("style-tweaker-legacy-profile");
      const switcherIcon = this.movedProfile.querySelector<HTMLElement>(
        ".workspace-drawer-vault-switcher-icon",
      );
      if (switcherIcon) switcherIcon.classList.remove("clickable-icon");

      const parent = this.originalParent;
      if (parent && parent.isConnected) {
        parent.insertBefore(this.movedProfile, this.originalNext);
      } else {
        // 原父节点已失效（Obsidian 重建）：放入当前左侧侧栏容器
        const sideDock = document.querySelector<HTMLElement>(
          ".workspace-split.mod-left-split .workspace-sidedock",
        );
        if (sideDock) {
          sideDock.insertBefore(this.movedProfile, sideDock.firstChild);
        } else {
          this.movedProfile.remove();
        }
      }
    }
    this.movedProfile = null;
    this.originalParent = null;
    this.originalNext = null;
    this.removeStyle();
  }

  /** 插件卸载时清理所有副作用 */
  cleanup(): void {
    this.disable();
  }

  private injectStyle(): void {
    if (!this.styleEl) {
      this.styleEl = createEl("style");
      this.styleEl.id = "style-tweaker-legacy-sidebar";
      document.head.appendChild(this.styleEl);
    }
    this.styleEl.textContent = TRADITIONAL_ICON_CSS;
  }

  private removeStyle(): void {
    if (this.styleEl) {
      this.styleEl.remove();
      this.styleEl = null;
    }
  }
}

// ------------------------------------------------------------
// 桌面端侧栏库名显示（自定义库名替换 / 文件列表顶部显示库名）
// 门控类（见 sidebar-desktop.css）：
//   - style-tweaker-custom-vault-name：侧栏库名替换为自定义名称（customVaultName 非空时）。
//   - style-tweaker-show-vault-name：文件列表顶部显示库名称。
//   - style-tweaker-center-vault-name：文件列表顶部库名称水平居中（依赖 show-vault-name）。
// 库名统一写入 CSS 变量 --style-tweaker-vault-name（content: var(...) 需带引号的字符串值）。
// ------------------------------------------------------------
const CUSTOM_VAULT_NAME_CLASS = "style-tweaker-custom-vault-name";
const SHOW_VAULT_NAME_CLASS = "style-tweaker-show-vault-name";
const CENTER_VAULT_NAME_CLASS = "style-tweaker-center-vault-name";
const VAULT_NAME_VAR = "--style-tweaker-vault-name";
// 文件列表顶部库名行的样式变量（字号 / 字体 / 深浅色各一套颜色）
const VAULT_NAME_FONT_SIZE_VAR = "--style-tweaker-vault-name-font-size";
const VAULT_NAME_FONT_VAR = "--style-tweaker-vault-name-font-family";
const VAULT_NAME_COLOR_DARK_VAR = "--style-tweaker-vault-name-color-dark";
const VAULT_NAME_COLOR_LIGHT_VAR = "--style-tweaker-vault-name-color-light";

/** 库名字体样式 → CSS font-family 变量 */
const VAULT_FONT_VAR: Record<string, string> = {
  interface: "var(--interface-font)",
  text: "var(--font-text)",
  monospace: "var(--font-monospace)",
};

/**
 * 桌面端侧栏库名服务：依据 customVaultName / showVaultNameInFileList 挂门控类，
 * 并向 body 注入库名 CSS 变量。
 *
 * 与 TabBarService 一样是「纯设置驱动的门控类」：只在各窗口文档挂/摘类、写 CSS
 * 变量，不注入 <style>，不需要轮询或 MutationObserver。由基类统一管理事件驱动。
 * 仅桌面端样式生效（sidebar-desktop.css 以 body:not(.is-mobile) 限定）。
 */
export class SidebarVaultNameService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    const customName = (s.customVaultName ?? "").trim();
    const customVaultNameOn = customName.length > 0;
    const showVaultNameOn = s.showVaultNameInFileList;
    const centerVaultNameOn = s.centerVaultNameInFileList;
    doc.body.classList.toggle(CUSTOM_VAULT_NAME_CLASS, customVaultNameOn);
    doc.body.classList.toggle(SHOW_VAULT_NAME_CLASS, showVaultNameOn);
    doc.body.classList.toggle(CENTER_VAULT_NAME_CLASS, centerVaultNameOn);
    // 库名统一变量：自定义非空用自定义值，否则用真实库名；以带引号字符串写入
    // （CSS content: var() 语法要求），输入框存储的仍是纯文本、不带引号。挂在 body 上。
    const vaultNameValue = customName.length > 0 ? customName : this.app.vault.getName();
    doc.body.style.setProperty(VAULT_NAME_VAR, `"${vaultNameValue}"`);
    // 文件列表顶部库名行的字号 / 字体 / 颜色变量（仅 show-vault-name 生效的 ::after 使用）。
    doc.body.style.setProperty(
      VAULT_NAME_FONT_SIZE_VAR,
      `${Number(s.vaultNameFontSizeInFileList) || 16}px`,
    );
    doc.body.style.setProperty(
      VAULT_NAME_FONT_VAR,
      VAULT_FONT_VAR[s.vaultNameFontInFileList] ?? "var(--interface-font)",
    );
    // 颜色按深浅色各写一套（CSS 按 body.theme-dark/.theme-light 取用）；default 不设，CSS 回退 --color-accent。
    const colorDark = accentToHex(s.vaultNameColorInFileList, true);
    const colorLight = accentToHex(s.vaultNameColorInFileList, false);
    if (colorDark && colorLight) {
      doc.body.style.setProperty(VAULT_NAME_COLOR_DARK_VAR, colorDark);
      doc.body.style.setProperty(VAULT_NAME_COLOR_LIGHT_VAR, colorLight);
    } else {
      doc.body.style.removeProperty(VAULT_NAME_COLOR_DARK_VAR);
      doc.body.style.removeProperty(VAULT_NAME_COLOR_LIGHT_VAR);
    }
  }

  protected clearDocument(doc: Document): void {
    doc.body?.style.removeProperty(VAULT_NAME_VAR);
    doc.body?.style.removeProperty(VAULT_NAME_FONT_SIZE_VAR);
    doc.body?.style.removeProperty(VAULT_NAME_FONT_VAR);
    doc.body?.style.removeProperty(VAULT_NAME_COLOR_DARK_VAR);
    doc.body?.style.removeProperty(VAULT_NAME_COLOR_LIGHT_VAR);
    doc.body?.classList.remove(
      CUSTOM_VAULT_NAME_CLASS,
      SHOW_VAULT_NAME_CLASS,
      CENTER_VAULT_NAME_CLASS,
    );
  }
}
