/**
 * 编辑器链接样式模板。
 *
 * 原为 src/styles/editor/link.css；因 text-decoration-* 会被
 * no-unsupported-browser-features（旧基线 Electron 39）误报为「部分支持」，
 * 故整份迁入 TS 由 EditorLinkService 运行时注入，样式内容完全不变。
 *
 * 组织顺序与 EditorLinkService 的功能列表同序：
 *   0. 变量收敛：把「设置变量 → 实际色 / 下划线色」的重复计算集中到一处
 *   1. 颜色（门控 .style-tweaker-link-color-custom）：内部链接 → 未创建链接 → 外部链接
 *   2. 下划线（三个独立门控）：内部 / 未创建 / 外部
 *   3. 外部链接图标、彩色悬浮动画
 *
 * DOM 备忘（选择器为何长这样）：
 *   - 阅读模式：a.internal-link / a.external-link；未创建链接为 .internal-link.is-unresolved。
 *   - 实时预览：span.cm-hmd-internal-link，未创建链接是同一元素再加 .is-unresolved；
 *     链接文字通常包在子级 .cm-underline 内，光标进入所在行后 [[ ]] 展开、.cm-underline 消失，
 *     故父级与子级必须一并覆盖，否则活动行链接会回退成原生色。
 *   - 编辑器外部链接：用 span.cm-link（文字）/ span.cm-url（网址与括号格式符号）着色，
 *     源码与实时预览同属 .cm-s-obsidian 作用域。
 */

export const LINK_STYLES_CSS = `
/* ============================================================
   0. 变量收敛
   门控类生效时才定义；规则里只引用这四个变量，色值/下划线色只在一处计算。
   下划线色统一取 40% 淡化（原为浅色 35% / 深色 40% 两套）。
   ============================================================ */
body.style-tweaker-link-color-custom {
  --st-link-internal: var(--style-tweaker-link-internal, var(--link-color));
  --st-link-external: var(--style-tweaker-link-external, var(--link-external-color));
  --st-link-internal-line: color-mix(in srgb, var(--st-link-internal) 40%, transparent);
  --st-link-external-line: color-mix(in srgb, var(--st-link-external) 40%, transparent);
}

/* ============================================================
   1. 颜色（门控 .style-tweaker-link-color-custom）
   ============================================================ */

/* 1.1 内部链接 · 阅读模式 */
body.style-tweaker-link-color-custom :is(.markdown-preview-view, .markdown-rendered) .internal-link {
  color: var(--st-link-internal);
  text-decoration-color: var(--st-link-internal-line);
}

/* 1.1 内部链接 · 实时预览（父级 + 子级两种形态，见文件头 DOM 备忘） */
body.style-tweaker-link-color-custom .markdown-source-view.cm-s-obsidian span.cm-hmd-internal-link,
body.style-tweaker-link-color-custom .markdown-source-view .cm-hmd-internal-link .cm-underline,
body.style-tweaker-link-color-custom .markdown-source-view.mod-cm6 span.cm-hmd-internal-link .is-unresolved .cm-underline {
  color: var(--st-link-internal);
  text-decoration-color: var(--st-link-internal-line);
}

/* 1.1 内部链接 · 源码模式（[[ ]] 格式符号 .cm-formatting-link-* 保持原生语法色） */
body.style-tweaker-link-color-custom .markdown-source-view:not(.is-live-preview) .cm-hmd-internal-link {
  color: var(--st-link-internal);
}

/* 1.2 未创建链接 · 实时预览：色值与内部链接一致，单列是因为
   .is-unresolved 常与 .cm-hmd-internal-link 是同一元素，选择器形态不同 */
body.style-tweaker-link-color-custom .markdown-source-view.mod-cm6 .is-unresolved {
  color: var(--st-link-internal);
}

/* 1.2 未创建链接 · 悬浮保持与悬浮前一致：!important 用于压过主题的
   span.cm-hmd-internal-link { color: var(--link-color) }，否则悬浮时会跳色 */
body.style-tweaker-link-color-custom .markdown-source-view .is-unresolved:hover,
body.style-tweaker-link-color-custom .markdown-source-view .is-unresolved:hover .cm-underline {
  color: var(--st-link-internal) !important;
}

/* 1.3 外部链接 · 阅读模式 */
body.style-tweaker-link-color-custom .external-link {
  color: var(--st-link-external);
  text-decoration-color: var(--st-link-external-line);
}

/* 1.3 外部链接 · 阅读模式悬浮（保持与悬浮前一致） */
body.style-tweaker-link-color-custom .external-link:hover {
  color: var(--st-link-external);
  text-decoration-color: var(--st-link-external-line);
}

/* 1.3 外部链接 · 编辑器（源码与实时预览同作用域）：
   .cm-link:not(.cm-formatting) 命中链接文字并排除 [ ] 格式符号；
   span.cm-url 命中网址与括号（Obsidian 本身也一并着色，保持一致）。 */
body.style-tweaker-link-color-custom .cm-s-obsidian span.cm-link:not(.cm-formatting),
body.style-tweaker-link-color-custom .cm-s-obsidian span.cm-url {
  color: var(--st-link-external);
}

/* 1.3 外部链接 · 实时预览：文字被 .cm-underline 包裹时补一条子级 */
body.style-tweaker-link-color-custom .markdown-source-view .cm-link .cm-underline,
body.style-tweaker-link-color-custom .markdown-source-view .cm-url .cm-underline {
  color: var(--st-link-external);
}

/* 1.3 外部链接 · 实时预览悬浮（保持与悬浮前一致；下划线取 currentColor 跟随文字） */
body.style-tweaker-link-color-custom .markdown-source-view .cm-link:hover,
body.style-tweaker-link-color-custom .markdown-source-view .cm-link:hover .cm-underline,
body.style-tweaker-link-color-custom .markdown-source-view .cm-url:hover,
body.style-tweaker-link-color-custom .markdown-source-view .cm-url:hover .cm-underline {
  color: var(--st-link-external);
  text-decoration-color: currentColor;
}

/* ============================================================
   2. 下划线（三个独立门控；开启 = 去除下划线）
   ============================================================ */

/* 2.1 内部链接下划线（已用 :not(.is-unresolved) 排除未创建链接，见 2.2） */
body.style-tweaker-link-underline-internal .markdown-source-view.mod-cm6 .cm-hmd-internal-link > *:not(.is-unresolved).cm-underline,
body.style-tweaker-link-underline-internal :is(.markdown-preview-view, .markdown-rendered) .internal-link:not(.is-unresolved) {
  text-decoration-line: none;
}

/* 2.2 未创建链接下划线：text-decoration 不会继承，父级与其子级元素需分别清除，
   故阅读模式与编辑器各列「元素自身 + 子级」两条。 */
body.style-tweaker-link-underline-unresolved :is(.markdown-preview-view, .markdown-rendered) .internal-link.is-unresolved,
body.style-tweaker-link-underline-unresolved :is(.markdown-preview-view, .markdown-rendered) .internal-link.is-unresolved > *,
body.style-tweaker-link-underline-unresolved .markdown-source-view.mod-cm6 .is-unresolved,
body.style-tweaker-link-underline-unresolved .markdown-source-view.mod-cm6 .is-unresolved .cm-underline {
  text-decoration: none;
}

/* 2.3 外部链接下划线：编辑器侧 Obsidian 把下划线设在 span.cm-url
   （含括号格式符号 .cm-formatting-link.cm-url），必须用相同作用域覆盖。 */
body.style-tweaker-link-underline-external a.external-link,
body.style-tweaker-link-underline-external .markdown-source-view.mod-cm6 .cm-link .cm-underline,
body.style-tweaker-link-underline-external .markdown-source-view.mod-cm6 .cm-url .cm-underline,
body.style-tweaker-link-underline-external .cm-s-obsidian span.cm-formatting-link.cm-url,
body.style-tweaker-link-underline-external .cm-s-obsidian span.cm-url {
  text-decoration-line: none;
}

/* ============================================================
   3. 图标与动画
   ============================================================ */

/* 去除外部链接图标 */
body.style-tweaker-link-remove-external-icon a.external-link,
body.style-tweaker-link-remove-external-icon span.external-link {
  background-image: none;
}

/* 彩色内部/外部链接悬浮动画（阅读模式） */
body.style-tweaker-link-colorful-animation :is(.markdown-preview-view, .markdown-rendered) .internal-link:hover,
body.style-tweaker-link-colorful-animation :is(.markdown-preview-view, .markdown-rendered) .external-link:hover {
  animation: 2s style-tweaker-colorful-link infinite;
}

@keyframes style-tweaker-colorful-link {
  0% {
    filter: hue-rotate(0deg);
  }

  100% {
    filter: hue-rotate(360deg);
  }
}
`;
