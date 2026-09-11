/**
 * 活动标签前邻标签状态服务
 *
 * 对应门控：style-tweaker-bg-image-active（图片背景激活，桌面端）。
 * 消费 CSS：appearance/image/divider.css
 *           （style-tweaker-tab-before-active，隐藏活动标签前邻标签的残留分隔线）。
 *
 * 把"某标签头紧邻活动标签（其后是 .is-active）"维护成该标签头上的状态类，
 * 替代 divider.css 原先的 :has(+ .is-active)。仅当图片背景激活（桌面）时观察。
 */

import { DomStateServiceBase } from "./dom-state-service-base";

/** 图片背景激活门控类（background-service 挂载） */
const IMAGE_ACTIVE_CLASS = "style-tweaker-bg-image-active";
/** 前邻活动标签的状态类（divider.css 消费） */
const TAB_BEFORE_ACTIVE_CLASS = "style-tweaker-tab-before-active";

/** 元素是否属于标签头区域（决定是否值得刷新标签分类） */
function inTabArea(el: Element | null): boolean {
  if (!el) return false;
  return (
    el.classList?.contains("workspace-tab-header") ||
    el.closest(".workspace-tab-header-container") !== null ||
    el.closest(".workspace-tab-header") !== null
  );
}

export class TabBeforeActiveStateService extends DomStateServiceBase {
  protected isActive(doc: Document): boolean {
    if (!doc?.body) return false;
    const body = doc.body;
    return (
      body.classList.contains(IMAGE_ACTIVE_CLASS) &&
      !body.classList.contains("is-mobile")
    );
  }

  protected refreshAll(doc: Document): void {
    if (!doc?.body) return;
    this.refreshTabHeaders(doc);
  }

  protected onMutations(doc: Document, records: MutationRecord[]): void {
    let sawTab = false;
    for (const record of records) {
      const target = record.target.instanceOf(Element) ? record.target : null;
      if (inTabArea(target)) {
        sawTab = true;
        break;
      }
      if (record.type === "childList") {
        for (const node of Array.from(record.addedNodes)) {
          if (node.instanceOf(Element) && inTabArea(node)) {
            sawTab = true;
            break;
          }
        }
        if (sawTab) break;
      }
    }
    if (sawTab) this.refreshTabHeaders(doc);
  }

  protected clearStates(doc: Document): void {
    if (!doc?.body) return;
    doc
      .querySelectorAll<HTMLElement>(".workspace-tab-header")
      .forEach((header) => header.classList.remove(TAB_BEFORE_ACTIVE_CLASS));
  }

  private refreshTabHeaders(doc: Document): void {
    doc
      .querySelectorAll<HTMLElement>(".workspace-tab-header")
      .forEach((header) => {
        const next = header.nextElementSibling;
        const isBeforeActive = !!(
          next && next.classList.contains("is-active")
        );
        header.classList.toggle(TAB_BEFORE_ACTIVE_CLASS, isBeforeActive);
      });
  }
}
