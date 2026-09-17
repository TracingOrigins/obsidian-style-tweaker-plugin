/**
 * 内嵌文档（canvas 卡片 / markdown embed 的 iframe）状态服务
 *
 * 背景：canvas 卡片与 markdown embed 用 <iframe class="embed-iframe"> 承载**独立 Document**。
 * 图片模式下要让内嵌文档的编辑区透明以透出壁纸，但主窗口与内嵌文档是不同 Document，
 * 区分二者需要 :has()，而官方 lint 禁用 :has()。
 *
 * 方案：直接查询 DOM 挂状态类（同 SidebarDesktopService 的做法）。
 * 两条命中路径，任一成立即挂类：
 *   1. 主文档里找到 iframe.embed-iframe → 取其 contentDocument 的 body 挂类
 *      （不依赖 getAppDocuments 是否把内嵌文档纳入，这是主要路径）；
 *   2. 文档自身就是内嵌文档（window 不是顶层 window / 含 .mod-inside-iframe）时自挂。
 *
 * 时序：iframe 内容是异步加载的，故监听 load 后再挂一次；
 * canvas 卡片是动态插入的，故用 MutationObserver 观察主文档子树。
 *
 * 消费 CSS：styles/appearance/image/canvas-glass.css（body.style-tweaker-inside-iframe）
 */

import { BaseService } from "../base-service";

/** 「本文档是被嵌入的内嵌文档」状态类 */
const EMBED_DOC_CLASS = "style-tweaker-inside-iframe";

/** 已绑定 load 监听的标记（dataset key） */
const BOUND_FLAG = "styleTweakerEmbedBound";

/** 取 iframe 内部文档；沙箱限制或跨域时返回 null */
function contentDocOf(frame: HTMLIFrameElement): Document | null {
    try {
        return frame.contentDocument ?? null;
    } catch {
        return null;
    }
}

export class EmbedDocumentStateService extends BaseService {
    /** 每文档一个观察器，捕捉动态插入的 iframe */
    private readonly observers = new Map<Document, MutationObserver>();

    protected applyToDocument(doc: Document): void {
        if (!doc?.body) return;
        if (this.getSettings().backgroundType !== "image") {
            this.detach(doc);
            this.unmarkAll(doc);
            return;
        }
        // 路径 2：当前文档自己就是内嵌文档
        if (this.isEmbeddedDoc(doc)) doc.body.classList.add(EMBED_DOC_CLASS);
        // 路径 1：当前文档内含有嵌入 iframe，钻进去给它们的 body 挂类
        this.ensureObserver(doc);
        this.markIframes(doc);
    }

    protected clearDocument(doc: Document): void {
        this.detach(doc);
        this.unmarkAll(doc);
    }

    /** 遍历文档内的嵌入 iframe，给其内部 body 挂类 */
    private markIframes(doc: Document): void {
        const frames = doc.querySelectorAll<HTMLIFrameElement>("iframe.embed-iframe");
        frames.forEach((frame) => {
            const mark = (): void => {
                contentDocOf(frame)?.body?.classList.add(EMBED_DOC_CLASS);
            };
            mark();
            // 内容异步加载：load 后再挂一次（每个 iframe 只绑一次）
            if (!frame.dataset[BOUND_FLAG]) {
                frame.dataset[BOUND_FLAG] = "1";
                frame.addEventListener("load", mark);
            }
        });
    }

    /** 移除本文档及其中 iframe 内文档上的状态类 */
    private unmarkAll(doc: Document): void {
        doc.body?.classList.remove(EMBED_DOC_CLASS);
        doc.querySelectorAll?.<HTMLIFrameElement>("iframe.embed-iframe").forEach((frame) => {
            contentDocOf(frame)?.body?.classList.remove(EMBED_DOC_CLASS);
        });
    }

    /** 文档自身是否是被嵌入的内嵌文档 */
    private isEmbeddedDoc(doc: Document): boolean {
        const view = doc.defaultView;
        if (view && view !== view.top) return true;
        return doc.querySelector?.(".markdown-source-view.mod-inside-iframe") != null;
    }

    /** 观察文档子树，捕捉动态插入的 iframe */
    private ensureObserver(doc: Document): void {
        if (this.observers.has(doc)) return;
        const observer = new MutationObserver(() => this.markIframes(doc));
        observer.observe(doc.body, { childList: true, subtree: true });
        this.observers.set(doc, observer);
    }

    private detach(doc: Document): void {
        const observer = this.observers.get(doc);
        if (observer) {
            observer.disconnect();
            this.observers.delete(doc);
        }
    }
}
