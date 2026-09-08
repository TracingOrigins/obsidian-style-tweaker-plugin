import { Plugin, App } from "obsidian";
import { StyleTweakerSettings } from "../types/settings";
import { getAppDocuments } from "../utils/documents";
import type { StyleService } from "../types/service";

/**
 * 逐窗口样式服务基类。
 *
 * 把「遍历所有可达窗口文档、注入样式/挂摘门控类、按设置刷新」这套通用骨架
 * （字段、constructor、enable/disable/apply/clearAll）吸收到基类。子类只需实现：
 *   - applyToDocument(doc)：对单个文档应用样式（挂类 / 设 CSS 变量 / 注入 <style>）
 *   - clearDocument(doc)：对单个文档清理样式（摘类 / 删变量 / 移除 <style>）
 *
 * 事件驱动：enable() 用 plugin.registerEvent 注册 workspace 的 layout-change /
 * window-open（布局就绪 onLayoutReady 由 Obsidian 一次性回调），插件卸载时自动退订，
 * 避免裸 workspace.on() 造成监听器泄漏。
 */
export abstract class BaseService implements StyleService {
  protected plugin: Plugin;
  protected app: App;
  protected getSettings: () => StyleTweakerSettings;
  protected enabled = false;
  protected listenersRegistered = false;
  // 记录被实际处理过的文档，便于 clearAll 时即使其已不在 getAppDocuments 列表也能清理。
  protected touchedDocuments = new Set<Document>();
  // registerExtraListeners() 返回的退订回调；disable() 时统一调用。
  private extraCleanup: (() => void) | null = null;

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.getSettings = getSettings;
  }

  enable(): void {
    this.enabled = true;
    if (!this.listenersRegistered) {
      this.listenersRegistered = true;
      const { workspace } = this.app;
      // 布局就绪（独立窗口、pop-out 加入后）补注入（一次性回调，Obsidian 内部管理）
      workspace?.onLayoutReady(() => this.apply());
      // 布局变化（设置窗口以独立窗口形态加入工作区等）与新窗口打开时补注入。
      // 用 registerEvent 注册：插件卸载时 Obsidian 自动移除监听，无需手动 off。
      if (workspace) {
        this.plugin.registerEvent(
          workspace.on("layout-change", () => this.apply()),
        );
        this.plugin.registerEvent(
          workspace.on("window-open", () => this.apply()),
        );
      }
      // 可选钩子：子类注册额外事件（如 vault 事件、轮询、observer），返回退订回调。
      this.extraCleanup = this.registerExtraListeners?.() ?? null;
    }
    this.apply();
  }

  disable(): void {
    this.enabled = false;
    this.extraCleanup?.();
    this.extraCleanup = null;
    this.clearAll();
  }

  apply(): void {
    if (!this.enabled) return;
    for (const doc of getAppDocuments(this.app)) {
      this.applyToDocument(doc);
      this.touchedDocuments.add(doc);
    }
  }

  clearAll(): void {
    for (const doc of new Set([
      ...this.touchedDocuments,
      ...getAppDocuments(this.app),
    ])) {
      // 文档可能已被销毁（如窗口关闭）
      if (!doc?.documentElement && !doc?.getElementById) continue;
      this.clearDocument(doc);
    }
    this.touchedDocuments.clear();
  }

  /** 移除文档 head 中指定 id 的注入 <style>（供范式 A 子类复用）。 */
  protected removeStyle(doc: Document, styleId: string): void {
    if (!doc?.getElementById) return;
    doc.getElementById(styleId)?.remove();
  }

  /**
   * 可选钩子：注册额外事件/轮询/observer。enable() 时调用，返回的清理回调会在
   * disable() 时统一执行（如 clearInterval、observer.disconnect、offref）。
   * 大多数子类无需实现。
   */
  protected registerExtraListeners?(): (() => void) | void;

  /** 对单个文档应用样式。 */
  protected abstract applyToDocument(doc: Document): void;

  /** 对单个文档清理样式。 */
  protected abstract clearDocument(doc: Document): void;
}
