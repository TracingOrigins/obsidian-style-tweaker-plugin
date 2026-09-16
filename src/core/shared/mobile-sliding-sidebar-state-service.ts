/**
 * 移动端「滑动侧边栏」状态服务
 *
 * 背景：slidingSidebar（.obsidian/appearance.json）**不产生任何 Obsidian 原生的
 * body / workspace 类**（只有 floatingNavigation → is-floating-nav、
 * autoFullScreen → auto-full-screen 有类），因此无法用原生选择器门控。
 * 但它会让内容区被 transform 推挤，而 transform 会破坏
 * background-attachment: fixed —— 依赖 fixed 与根层对齐的自挂壁纸会退化成
 * 「整张壁纸缩放到元素内」，与背后背景无法衔接。
 *
 * 本服务用 app.vault.getConfig("slidingSidebar") 读取该设置
 * （等价于读 appearance.json，但走官方 API，无需读文件与解析 JSON），
 * 把结果挂成 body 上的 style-tweaker-sliding-sidebar，供 CSS 用 :not() 门控切换策略。
 *
 * 该设置切换不派发可用事件，故用低频轮询感知；值未变化时不写 DOM。
 *
 * 消费 CSS：styles/appearance/image/ui-glass.css
 */

import { BaseService } from "../base-service";

/** 滑动侧边栏开启的状态类（ui-glass.css 的 :not() 门控消费） */
const SLIDING_CLASS = "style-tweaker-sliding-sidebar";

/** 轮询间隔（ms）：该设置无变更事件，只能轮询；值未变化时不写 DOM，开销可忽略 */
const POLL_MS = 1500;

export class MobileSlidingSidebarStateService extends BaseService {
    /** 上一次读到的值，避免无变化时重复写 DOM */
    private last: boolean | null = null;

    protected applyToDocument(doc: Document): void {
        if (!doc?.body) return;
        const on = this.readSlidingSidebar();
        this.last = on;
        doc.body.classList.toggle(SLIDING_CLASS, on);
    }

    protected clearDocument(doc: Document): void {
        doc?.body?.classList.remove(SLIDING_CLASS);
    }

    /** 读取 Obsidian 外观设置中的 slidingSidebar */
    private readSlidingSidebar(): boolean {
        // getConfig 在部分版本的 typings 中未声明，做一次宽松断言避免编译失败
        const vault = this.app.vault as unknown as {
            getConfig?: (key: string) => unknown;
        };
        try {
            return vault.getConfig?.("slidingSidebar") === true;
        } catch {
            // 读取失败时按「未开启」处理，保持 CSS 默认的壁纸策略
            return false;
        }
    }

    protected registerExtraListeners(): void {
        // registerInterval：插件卸载时由 Obsidian 自动清理，无需手动 clearInterval
        this.plugin.registerInterval(
            window.setInterval(() => {
                const next = this.readSlidingSidebar();
                if (next === this.last) return;
                this.last = next;
                this.apply();
            }, POLL_MS),
        );
    }
}
