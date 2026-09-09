/**
 * CM6 编辑器列表行类型状态服务
 *
 * 对应设置：listCustomColors / taskCustomColors。
 * 消费 CSS：editor/list.css（style-tweaker-line-ul / -ol / -task）。
 *
 * 把"CM6 源码/实时预览行的类型（无序/有序/任务）"维护成行上的状态类，
 * 替代 list.css 原先的 :has() 判断。仅当列表/任务自定义色任一开启时观察。
 */

import { DomStateServiceBase } from "./dom-state-service-base";

/** CM6 列表行类型状态类（list.css 消费） */
const LINE_UL_CLASS = "style-tweaker-line-ul";
const LINE_OL_CLASS = "style-tweaker-line-ol";
const LINE_TASK_CLASS = "style-tweaker-line-task";

function classifyLine(line: HTMLElement): void {
  const ul = line.querySelector(".cm-formatting-list-ul") !== null;
  const ol = line.querySelector(".cm-formatting-list-ol") !== null;
  // 源码模式任务行含 .cm-formatting-task；实时预览任务行含 .task-list-label
  const task =
    line.querySelector(".cm-formatting-task, .task-list-label") !== null;
  line.classList.toggle(LINE_UL_CLASS, ul);
  line.classList.toggle(LINE_OL_CLASS, ol);
  line.classList.toggle(LINE_TASK_CLASS, task);
}

/** 判断某元素是否为（或位于）CM6 源码/实时预览行 */
function resolveCmLine(el: Element): HTMLElement | null {
  if (el.classList?.contains("cm-line")) return el as HTMLElement;
  return el.closest(".markdown-source-view.mod-cm6 .cm-line");
}

export class EditorLineTypeStateService extends DomStateServiceBase {
  protected isActive(doc: Document): boolean {
    if (!doc?.body) return false;
    const s = this.getSettings();
    return s.listCustomColors || s.taskCustomColors;
  }

  protected refreshAll(doc: Document): void {
    if (!doc?.body) return;
    doc
      .querySelectorAll<HTMLElement>(".markdown-source-view.mod-cm6 .cm-line")
      .forEach(classifyLine);
  }

  protected onMutations(_doc: Document, records: MutationRecord[]): void {
    const lines = new Set<HTMLElement>();
    const visit = (el: Element | null): void => {
      if (!el) return;
      const line = resolveCmLine(el);
      if (line) lines.add(line);
    };
    for (const record of records) {
      const target = record.target.instanceOf(Element) ? record.target : null;
      if (record.type === "childList") {
        for (const node of Array.from(record.addedNodes)) {
          if (node.instanceOf(Element)) visit(node);
        }
      }
      if (target) visit(target);
    }
    lines.forEach(classifyLine);
  }

  protected clearStates(doc: Document): void {
    if (!doc?.body) return;
    doc
      .querySelectorAll<HTMLElement>(`.${LINE_UL_CLASS}, .${LINE_OL_CLASS}, .${LINE_TASK_CLASS}`)
      .forEach((el) =>
        el.classList.remove(LINE_UL_CLASS, LINE_OL_CLASS, LINE_TASK_CLASS),
      );
  }
}
