/**
 * CM6 编辑器块引用"末行"状态服务
 *
 * 对应设置：blockquoteStyle（仅 bubble / frame 需要封闭下边缘）。
 * 消费 CSS：editor/blockquote.css（style-tweaker-line-quote-last）。
 *
 * 把"该行是引用块的最后一行"维护成行上的状态类，替代 blockquote.css 原先的
 * :has(+ .HyperMD-quote) 判断（:has 会引起宽泛的失效重算，故前移到 TS）。
 * 仅气泡/边框风格生效时观察，其余风格不观察也不挂类。
 */

import { DomStateServiceBase } from "./dom-state-service-base";

/** 引用块末行状态类（blockquote.css 消费） */
const QUOTE_LAST_CLASS = "style-tweaker-line-quote-last";
/** CM6 源码/实时预览行选择器 */
const CM_LINE_SELECTOR = ".markdown-source-view.mod-cm6 .cm-line";
/** CM6 引用块行类名（源码模式与实时预览一致） */
const QUOTE_LINE_CLASS = "HyperMD-quote";

/** 跨窗口安全的 Element 判定；非元素节点返回 null。 */
function asElement(node: Node | null): Element | null {
  return node !== null && node.instanceOf(Element) ? node : null;
}

/** 判断某元素是否为（或位于）CM6 源码/实时预览行 */
function resolveCmLine(el: Element | null): HTMLElement | null {
  if (!el) return null;
  if (el.classList?.contains("cm-line")) return el as HTMLElement;
  return el.closest<HTMLElement>(CM_LINE_SELECTOR);
}

/** 引用块末行：下一个同级元素不是引用行即末行，没有后继同样是末行。 */
function classifyLine(line: HTMLElement): void {
  const next = line.nextElementSibling;
  line.classList.toggle(
    QUOTE_LAST_CLASS,
    line.classList.contains(QUOTE_LINE_CLASS) &&
      !next?.classList.contains(QUOTE_LINE_CLASS),
  );
}

export class EditorBlockquoteLineStateService extends DomStateServiceBase {
  protected isActive(doc: Document): boolean {
    if (!doc?.body) return false;
    const style = this.getSettings().blockquoteStyle;
    return style === "bubble" || style === "frame";
  }

  protected refreshAll(doc: Document): void {
    if (!doc?.body) return;
    doc.querySelectorAll<HTMLElement>(CM_LINE_SELECTOR).forEach(classifyLine);
  }

  protected onMutations(_doc: Document, records: MutationRecord[]): void {
    // 末行身份同时取决于"本行"与"前一行"的结构，故每次顺带重判前一行
    const lines = new Set<HTMLElement>();
    const visit = (node: Node | null): void => {
      const line = resolveCmLine(asElement(node));
      if (!line) return;
      lines.add(line);
      const prev = resolveCmLine(asElement(line.previousElementSibling));
      if (prev) lines.add(prev);
    };
    for (const record of records) {
      visit(record.target);
      if (record.type === "childList") {
        visit(record.previousSibling);
        visit(record.nextSibling);
        Array.from(record.addedNodes).forEach(visit);
      }
    }
    lines.forEach(classifyLine);
  }

  protected clearStates(doc: Document): void {
    if (!doc?.body) return;
    doc
      .querySelectorAll<HTMLElement>(`.${QUOTE_LAST_CLASS}`)
      .forEach((line) => line.classList.remove(QUOTE_LAST_CLASS));
  }
}
