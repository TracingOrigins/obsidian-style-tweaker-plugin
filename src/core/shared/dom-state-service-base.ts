/**
 * DOM 结构状态服务基类（shared/ 基础设施）。
 *
 * 目标：把 CSS 中少量必须保留的 `:has()` 判断前移到 TS，由 MutationObserver
 * 把「动态结构事实」维护成元素上的状态类（替代 :has()，规避 stylelint 告警）。
 *
 * 关键设计：**按需观察**——只有当对应设置项/门控类生效时才 attach 观察器，
 * 否则 detach 并清理状态类。这样功能关闭时不会产生"空转"观察开销
 * （相比恒定的 JS 观察，这正是优于宽泛 :has() 失效重算之处）。
 *
 * 子类只需实现：
 *   - isActive(doc)：本文档是否要维护该状态（读取设置 / 检查门控类）
 *   - refreshAll(doc)：全量刷新（初始、布局/窗口变化）
 *   - onMutations(doc, records)：增量处理
 *   - clearStates(doc)：清理本服务维护的状态类
 */

import { BaseService } from "../base-service";

export abstract class DomStateServiceBase extends BaseService {
  /** 每文档一个观察器，disable / 失效时统一断开 */
  private readonly observers = new Map<Document, MutationObserver>();

  /** 本服务是否应在该文档观察并维护状态（按设置项/门控类判断）。 */
  protected abstract isActive(doc: Document): boolean;

  /** 全量刷新状态（初始 apply、布局/窗口变化时调用）。 */
  protected abstract refreshAll(doc: Document): void;

  /** 增量处理 DOM 变化。 */
  protected abstract onMutations(
    doc: Document,
    records: MutationRecord[],
  ): void;

  /** 移除本服务在文档中维护的所有状态类。 */
  protected abstract clearStates(doc: Document): void;

  /** 观察器监听范围：默认全 body 的子树增删 + 类/勾选属性变化。 */
  protected observeOptions(): MutationObserverInit {
    return {
      subtree: true,
      childList: true,
      attributes: true,
      // 只关注类与任务勾选属性变化，避免编辑器 style/text 等高频变更触发扫描
      attributeFilter: ["class", "className", "data-task", "aria-checked", "checked"],
    };
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    if (this.isActive(doc)) {
      this.ensureObserver(doc);
      this.refreshAll(doc);
    } else {
      // 设置/门控未生效：断开观察器并清理状态，避免空转
      this.detach(doc);
    }
  }

  protected clearDocument(doc: Document): void {
    this.detach(doc);
  }

  private ensureObserver(doc: Document): void {
    if (this.observers.has(doc)) return;
    const observer = new MutationObserver((records) =>
      this.onMutations(doc, records),
    );
    observer.observe(doc.body, this.observeOptions());
    this.observers.set(doc, observer);
  }

  private detach(doc: Document): void {
    const observer = this.observers.get(doc);
    if (observer) {
      observer.disconnect();
      this.observers.delete(doc);
    }
    if (doc?.body) this.clearStates(doc);
  }
}
