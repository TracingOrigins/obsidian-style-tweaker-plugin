import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// 弹框背景模糊门控类（规则本体见 interface/modal.css）
const MODAL_BLUR_DESKTOP_CLASS = "style-tweaker-modal-blur-desktop";
const MODAL_BLUR_MOBILE_CLASS = "style-tweaker-modal-blur-mobile";

/**
 * 弹框服务：统一承载弹框（modal）相关的样式能力，后续弹框类需求都加在这里。
 *
 * 现有功能：弹框背景模糊——依据设置在 body 上挂门控类，控制打开弹框时是否
 * 模糊遮罩背后的界面内容：
 *   - desktopModalBlur → style-tweaker-modal-blur-desktop（CSS 侧限定非移动端生效）
 *   - mobileModalBlur  → style-tweaker-modal-blur-mobile（CSS 侧限定 is-mobile 生效）
 *
 * 两个开关各自独立，与背景模式（默认 / 纯色 / 图片）无关；
 * 设备限定放在 CSS 里，避免设置随 Obsidian Sync 同步到对端设备后误生效。
 * 纯门控类驱动，不注入 CSS 变量，由基类统一管理事件驱动。
 */
export class ModalService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    doc.body.classList.toggle(MODAL_BLUR_DESKTOP_CLASS, Boolean(s.desktopModalBlur));
    doc.body.classList.toggle(MODAL_BLUR_MOBILE_CLASS, Boolean(s.mobileModalBlur));
  }

  protected clearDocument(doc: Document): void {
    doc.body?.classList.remove(MODAL_BLUR_DESKTOP_CLASS, MODAL_BLUR_MOBILE_CLASS);
  }
}
