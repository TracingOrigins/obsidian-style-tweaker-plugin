import type { App } from "obsidian";

/**
 * 返回插件当前可达的所有 Obsidian 文档（Document）。
 *
 * Obsidian 1.13 起设置可承载于独立窗口；工作区拖出的 pop-out 标签页
 * 同样是独立窗口。这些窗口各自拥有独立的 Document，若只对主窗口的
 * `document` 注入 CSS 变量，其余窗口的壁纸会失效。因此需遍历所有可达
 * 文档并逐窗注入，保证主窗口、独立设置窗口、pop-out 窗口均显示壁纸。
 */
export function getAppDocuments(app?: App): Document[] {
  const documents = new Set<Document>();
  const add = (candidate: Document | null | undefined): void => {
    if (candidate?.documentElement && candidate.body) documents.add(candidate);
  };

  add(window.document);
  if (typeof activeDocument !== "undefined") add(activeDocument);

  const workspace = app?.workspace;
  add(workspace?.containerEl?.ownerDocument);
  workspace?.iterateAllLeaves?.((leaf) => {
    add(leaf.view?.containerEl?.ownerDocument);
  });

  // 独立窗口 / 弹出（pop-out）设置窗口各自拥有独立的 Document，且**不会**
  // 出现在 workspace.iterateAllLeaves() 中。若只枚举上面的来源，这类窗口
  // 的壁纸/变量会缺失，导致背景层回退为 none —— 现象即"打开设置窗口时背景
  // 不显示，重新设置一次才出现"。
  // 这些窗口由 app.windows（WindowManager，内部 API）管理。Obsidian 不同版本
  // 暴露的枚举入口不一致，这里做防御式探测，命中任意一个即可全部覆盖。
  try {
    const windows = (app as unknown as {
      windows?: Record<string, unknown>;
    }).windows;
    if (windows) {
      // 候选 1：直接返回 Document[] 的方法
      for (const method of [
        "getAllWindowDocuments",
        "getWindowDocuments",
        "getWindowDocumentList",
      ]) {
        const fn = windows[method] as (() => Document[]) | undefined;
        if (typeof fn === "function") {
          for (const doc of fn.call(windows)) add(doc);
        }
      }
      // 候选 2：内部 windows 列表，每项含 doc / win.document
      const list = (windows.windows ?? windows.windowList) as
        | Array<{ doc?: Document; win?: Window; document?: Document }>
        | undefined;
      if (Array.isArray(list)) {
        for (const w of list) {
          add(w.doc ?? w.win?.document ?? w.document);
        }
      }
    }
  } catch {
    // 某些 Obsidian 版本/移动端无此内部 API，忽略并依赖上述来源兜底。
  }

  return Array.from(documents);
}
