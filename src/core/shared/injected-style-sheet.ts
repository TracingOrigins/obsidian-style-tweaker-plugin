/**
 * 每文档注入静态 CSS 的控制器（Constructable Stylesheet + adoptedStyleSheets）。
 *
 * 用途：把原本位于 src/styles 目录下 CSS 文件、但会触发「部分支持特性」类误报的
 * 少量样式片段迁到 TS，由服务运行时注入，保证行为一致且 .css 源码不再含这些属性。
 * 与 background-service 的注入方式一致（规避 createEl("style") 的审核约束）；
 * 每文档持有一张独立 sheet（同一 sheet 不能跨文档复用）。
 *
 * 属于被 core/editor 等服务复用的跨域基础设施，故放在 core/shared/。
 */
export class InjectedStyleSheet {
  private readonly sheets = new Map<Document, CSSStyleSheet>();

  constructor(private readonly css: string) {}

  /** 将样式应用到指定文档（已存在则幂等）；CSS 解析失败时静默保留旧内容。 */
  apply(doc: Document): void {
    const win = doc.defaultView;
    if (!win || typeof win.CSSStyleSheet !== "function") return;
    let sheet = this.sheets.get(doc);
    if (!sheet) {
      sheet = new win.CSSStyleSheet();
      this.sheets.set(doc, sheet);
    }
    try {
      sheet.replaceSync(this.css);
    } catch (e) {
      console.warn("[style-tweaker] injected css update failed:", e);
      return;
    }
    const adopted = Array.from(doc.adoptedStyleSheets ?? []);
    if (!adopted.includes(sheet)) {
      doc.adoptedStyleSheets = [...adopted, sheet];
    }
  }

  /** 从指定文档移除注入的样式。 */
  remove(doc: Document): void {
    const sheet = this.sheets.get(doc);
    if (!sheet) return;
    this.sheets.delete(doc);
    if (doc.adoptedStyleSheets) {
      doc.adoptedStyleSheets = Array.from(doc.adoptedStyleSheets).filter(
        (s) => s !== sheet,
      );
    }
  }
}
