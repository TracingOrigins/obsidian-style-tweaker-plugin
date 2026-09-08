import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { getAppDocuments } from "../../utils/documents";

// ============================================================
// 左右空间标记服务（合并 LeftSpaceService / RightSpaceService）
// ------------------------------------------------------------
// 目标：当左侧/右侧 dock 关闭（.workspace:not(.is-*-sidedock-open)）且整体布局为
// 边框/卡片（layoutMode ∈ {border, cards}）时，定位 workspace 左右两侧区域的
// workspace-tabs，按垂直位置打上语义类，供布局 CSS（border/cards）消费：
//   - 最上方：沿用 Obsidian 自带 mod-top-*-space，不打标
//   - 中间部分：加 mod-middle-*-space
//   - 最下方最后一个：加 mod-bottom-*-space
//
// 左右两侧定位的差异（沿用各自原有行为）：
//   - 左侧：从 mod-root 的【第二个】子元素开始；
//           vertical 取【第 2】子元素；horizontal 从【第 2】个子元素起循环。
//   - 右侧：从 mod-root 的【最后一个】子元素开始；
//           vertical 取【最后一个】子元素；horizontal 从【第一个】到最后一个循环。
//   - 对应 top 类：mod-top-left-space / mod-top-right-space。
//
// 打标：跳过 mod-top-*-space，最后 bottom、其它 middle。
//
// 触发：复用基类 onLayoutReady / layout-change / window-open，并通过
//       registerExtraListeners 挂 MutationObserver 监听 workspace 子树实时重算。
//       左右两侧共用一个 observer，同一结构变化只重算一次。
//
// 防卡死关键：applyToDocument 采用「断开观察 → 打标 → 打标完成后再观察」的自包含流程。
// ============================================================

type Side = "left" | "right";

interface SideClasses {
  topClass: string;
  middleClass: string;
  bottomClass: string;
}

export class LeftRightSpaceService extends BaseService {
  // 各文档的 workspace 子树观察器
  private observers = new Map<Document, MutationObserver>();

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    // 先断开本文档观察，避免打标引发的 class 变化再次触发回调（防死循环）
    this.disconnectDoc(doc);

    // 清理本服务添加的类（不碰 mod-top-*-space）
    this.clearMarkedTabs(doc);

    const s = this.getSettings();
    const mode = s.layoutMode ?? "default";
    const isLayoutActive = mode === "border" || mode === "cards";
    if (isLayoutActive) {
      const workspace = doc.querySelector<HTMLElement>(".workspace");
      if (workspace) {
        const rootSplit = doc.querySelector<HTMLElement>(
          ".workspace-split.mod-root, .workspace-split.mod-vertical.mod-root",
        );
        if (rootSplit) {
          // 左侧：dock 关闭时定位
          if (!workspace.classList.contains("is-left-sidedock-open")) {
            this.locateSide(rootSplit, "left");
          }
          // 右侧：dock 关闭时定位
          if (!workspace.classList.contains("is-right-sidedock-open")) {
            this.locateSide(rootSplit, "right");
          }
        }
      }
    }

    // 打标完成后再观察，避免自我循环
    if (this.enabled) this.observe(doc);
  }

  protected clearDocument(doc: Document): void {
    this.disconnectDoc(doc);
    this.clearMarkedTabs(doc);
  }

  protected registerExtraListeners(): () => void {
    for (const doc of getAppDocuments(this.app)) {
      this.observe(doc);
    }
    return () => {
      for (const obs of this.observers.values()) obs.disconnect();
      this.observers.clear();
    };
  }

  // 观察回调：直接重算（applyToDocument 内部会断开→打标→再观察）
  private onMutate(doc: Document): void {
    this.applyToDocument(doc);
  }

  // 幂等断开某文档的观察
  private disconnectDoc(doc: Document): void {
    const obs = this.observers.get(doc);
    if (obs) {
      obs.disconnect();
      this.observers.delete(doc);
    }
  }

  // 建立对某文档 workspace 子树的观察（先断开旧的，避免重复）。
  // 只监听结构变化（childList），避免监听子树内任意元素的 class 变化
  // （Obsidian 中高频发生）导致过度重算与卡顿；侧边栏开合会增删节点，
  // 因此 is-*-sidedock-open 的切换也能通过 childList 捕获。
  private observe(doc: Document): void {
    this.disconnectDoc(doc);
    const workspace = doc.querySelector<HTMLElement>(".workspace");
    if (!workspace) return;
    const obs = new MutationObserver(() => this.onMutate(doc));
    obs.observe(workspace, {
      subtree: true,
      childList: true,
    });
    this.observers.set(doc, obs);
  }

  // 清理文档内本服务添加的四个类（保留 mod-top-*-space）
  private clearMarkedTabs(doc: Document): void {
    doc
      .querySelectorAll<HTMLElement>(
        ".workspace-tabs.mod-middle-left-space," +
          ".workspace-tabs.mod-bottom-left-space," +
          ".workspace-tabs.mod-middle-right-space," +
          ".workspace-tabs.mod-bottom-right-space",
      )
      .forEach((el) =>
        el.classList.remove(
          "mod-middle-left-space",
          "mod-bottom-left-space",
          "mod-middle-right-space",
          "mod-bottom-right-space",
        ),
      );
  }

  // 对指定侧（左/右）定位：起点取 mod-root 的第二个（左）或最后一个（右）子元素
  private locateSide(rootSplit: HTMLElement, side: Side): void {
    const children = Array.from(rootSplit.children) as HTMLElement[];
    const start =
      side === "left"
        ? children[1]
        : children[children.length - 1];
    if (!start) return;
    const tabs: HTMLElement[] = [];
    this.dispatchStart(start, side, tabs);
    this.applyMarks(tabs, side);
  }

  // 对起点分派
  private dispatchStart(start: HTMLElement, side: Side, tabs: HTMLElement[]): void {
    const { topClass, bottomClass } = this.classesFor(side);
    if (start.matches(".workspace-tabs")) {
      // 情况 1：start 本身就是 top-*-space → 直接加 bottom；否则收集
      if (start.matches("." + topClass)) {
        start.classList.add(bottomClass);
      } else {
        tabs.push(start);
      }
      return;
    }
    if (start.matches(".workspace-split.mod-horizontal")) {
      // 情况 2：对该 horizontal 循环定位
      this.loopHorizontal(start, side, tabs);
      return;
    }
    if (start.matches(".workspace-split.mod-vertical")) {
      // 情况 3：取第 2（左）/最后一个（右）子元素
      const target = this.pickChild(start, side);
      if (target) this.dispatchAfterVertical(target, side, tabs);
    }
  }

  // 情况 3：vertical 的子元素处理（左取第 2、右取最后一个）
  private dispatchAfterVertical(
    el: HTMLElement,
    side: Side,
    tabs: HTMLElement[],
  ): void {
    if (el.matches(".workspace-split.mod-horizontal")) {
      this.loopHorizontal(el, side, tabs);
    } else if (el.matches(".workspace-tabs")) {
      tabs.push(el);
    } else if (el.matches(".workspace-split.mod-vertical")) {
      const target = this.pickChild(el, side);
      if (target) this.dispatchAfterVertical(target, side, tabs);
    }
    // 其它类型忽略
  }

  // 循环定位 horizontal：左从第 2 个子元素起，右从第一个到最后一个循环
  private loopHorizontal(
    horizontal: HTMLElement,
    side: Side,
    tabs: HTMLElement[],
  ): void {
    const children = Array.from(horizontal.children) as HTMLElement[];
    const startIdx = side === "left" ? 1 : 0;
    for (let i = startIdx; i < children.length; i++) {
      this.loopVisit(children[i], side, tabs);
    }
  }

  // 循环模式下单个子元素的处理
  private loopVisit(el: HTMLElement, side: Side, tabs: HTMLElement[]): void {
    if (el.matches(".workspace-tabs")) {
      tabs.push(el);
    } else if (el.matches(".workspace-split.mod-horizontal")) {
      this.loopHorizontal(el, side, tabs);
    } else if (el.matches(".workspace-split.mod-vertical")) {
      const target = this.pickChild(el, side);
      if (target) this.dispatchAfterVertical(target, side, tabs);
    }
  }

  // vertical 取子元素：左取第 2、右取最后一个
  private pickChild(split: HTMLElement, side: Side): HTMLElement | undefined {
    if (side === "left") {
      return split.children[1] as HTMLElement | undefined;
    }
    return split.children[split.children.length - 1] as HTMLElement | undefined;
  }

  // 该侧对应的类名
  private classesFor(side: Side): SideClasses {
    if (side === "left") {
      return {
        topClass: "mod-top-left-space",
        middleClass: "mod-middle-left-space",
        bottomClass: "mod-bottom-left-space",
      };
    }
    return {
      topClass: "mod-top-right-space",
      middleClass: "mod-middle-right-space",
      bottomClass: "mod-bottom-right-space",
    };
  }

  // 打标：跳过已由 Obsidian 标记为 top-*-space 的元素（不打 middle/bottom），
  // 剩余的最后一个 bottom、其它 middle
  private applyMarks(tabs: HTMLElement[], side: Side): void {
    const { topClass, middleClass, bottomClass } = this.classesFor(side);
    const targets = tabs.filter((t) => !t.matches("." + topClass));
    if (targets.length === 0) return;
    for (let i = 0; i < targets.length; i++) {
      if (i === targets.length - 1) {
        targets[i].classList.add(bottomClass);
      } else {
        targets[i].classList.add(middleClass);
      }
    }
  }
}
