import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// 移动端抽屉内容区块置顶门控类（见 sidebar-mobile.css）。
// 三个类均挂在 body 上，且 CSS 以 body.is-mobile.<class> 限定，仅移动端生效；
// 桌面端不受影响。激活条件仅由对应设置项决定。
const MOBILE_DRAWER_HEADER_TOP_CLASS = "style-tweaker-mobile-drawer-header-top";
const MOBILE_DRAWER_TABS_TOP_CLASS = "style-tweaker-mobile-drawer-tabs-top";
const MOBILE_DRAWER_NAV_TOP_CLASS = "style-tweaker-mobile-drawer-nav-top";

/**
 * 移动端抽屉布局服务：把移动抽屉（workspace-drawer）中的内容区块上移置顶。
 *
 * 与 TabBarService 一样是「纯设置驱动的门控类」：只在各窗口文档挂/摘类，不注入
 * <style>，不需要轮询或 MutationObserver。由基类统一管理事件驱动。
 *
 * 桌面端侧栏相关样式（传统侧栏布局、库名显示）见 sidebar-desktop-service.ts，
 * 本服务只负责移动端。
 */
export class SidebarMobileService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    // 移动端抽屉内容区块置顶：仅由对应设置项决定。挂在 body 上，
    // CSS 以 body.is-mobile.<class> 限定，仅移动端生效。
    doc.body.classList.toggle(MOBILE_DRAWER_HEADER_TOP_CLASS, s.mobileDrawerHeaderTop);
    doc.body.classList.toggle(MOBILE_DRAWER_TABS_TOP_CLASS, s.mobileDrawerTabsTop);
    doc.body.classList.toggle(MOBILE_DRAWER_NAV_TOP_CLASS, s.mobileDrawerNavTop);
  }

  protected clearDocument(doc: Document): void {
    doc.body?.classList.remove(
      MOBILE_DRAWER_HEADER_TOP_CLASS,
      MOBILE_DRAWER_TABS_TOP_CLASS,
      MOBILE_DRAWER_NAV_TOP_CLASS,
    );
  }
}
