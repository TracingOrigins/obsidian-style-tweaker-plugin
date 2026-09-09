/**
 * 移动端抽屉"无导航按钮"状态服务
 *
 * 对应设置：mobileDrawerHeaderTop / mobileDrawerTabsTop（导航上移 combos）。
 * 消费 CSS：interface/sidebar/sidebar-mobile.css
 *           （style-tweaker-drawer-nav-buttons-empty）。
 *
 * 把"抽屉内没有非空 .nav-buttons-container"维护成抽屉上的状态类，
 * 替代 sidebar-mobile.css 原先的 :not(:has(.nav-buttons-container:not(:empty)))。
 * 仅当相关置顶设置开启时观察，否则断开并清类。
 */

import { DomStateServiceBase } from "./dom-state-service-base";

/** 抽屉不含非空导航按钮的状态类（sidebar-mobile.css 消费） */
const DRAWER_NAV_EMPTY_CLASS = "style-tweaker-drawer-nav-buttons-empty";

/** 元素是否属于"抽屉导航"相关区域（决定是否值得刷新抽屉分类） */
function inDrawerArea(el: Element | null): boolean {
  if (!el) return false;
  return (
    el.classList?.contains("workspace-drawer") ||
    el.closest(".workspace-drawer") !== null ||
    el.closest(".nav-buttons-container") !== null
  );
}

export class MobileDrawerNavStateService extends DomStateServiceBase {
  protected isActive(doc: Document): boolean {
    if (!doc?.body) return false;
    const s = this.getSettings();
    return s.mobileDrawerHeaderTop || s.mobileDrawerTabsTop;
  }

  protected refreshAll(doc: Document): void {
    if (!doc?.body) return;
    this.refreshDrawers(doc);
  }

  protected onMutations(doc: Document, records: MutationRecord[]): void {
    let sawDrawer = false;
    for (const record of records) {
      const target = record.target.instanceOf(Element) ? record.target : null;
      if (inDrawerArea(target)) {
        sawDrawer = true;
        break;
      }
      if (record.type === "childList") {
        for (const node of Array.from(record.addedNodes)) {
          if (node.instanceOf(Element) && inDrawerArea(node)) {
            sawDrawer = true;
            break;
          }
        }
        if (sawDrawer) break;
      }
    }
    if (sawDrawer) this.refreshDrawers(doc);
  }

  protected clearStates(doc: Document): void {
    if (!doc?.body) return;
    doc
      .querySelectorAll<HTMLElement>(".workspace-drawer")
      .forEach((drawer) => drawer.classList.remove(DRAWER_NAV_EMPTY_CLASS));
  }

  private refreshDrawers(doc: Document): void {
    doc
      .querySelectorAll<HTMLElement>(".workspace-drawer")
      .forEach((drawer) => {
        const hasNavButtons = Array.from(
          drawer.querySelectorAll<HTMLElement>(".nav-buttons-container"),
        ).some((c) => c.children.length > 0);
        drawer.classList.toggle(DRAWER_NAV_EMPTY_CLASS, !hasNavButtons);
      });
  }
}
