/**
 * 属性区域（Properties / Frontmatter）样式模板。
 *
 * 原为 src/styles/editor/properties.css，因 column-count/column-rule 会被
 * no-unsupported-browser-features（旧基线 Electron 39）误报为「部分支持」，
 * 故迁入 TS 由 EditorPropertiesService 运行时注入。
 */

export const PROPERTIES_STYLES_CSS = `
/* 属性名称输入框默认透明 */
input.metadata-property-key-input {
  background: transparent;
}

/* 属性区域分栏布局（总开关开启后，桌面端与移动端各用自己的栏数与分隔线）
   门控类 .style-tweaker-properties-column 由 EditorPropertiesService 注入；
   栏数读取 --style-tweaker-properties-column-count-desktop / -mobile（默认 2 / 1）；
   栏间分隔线按平台读取 --style-tweaker-properties-divider-*-desktop / -mobile：
   线型（dashed / solid，默认虚线）、颜色（未设置时回退主题强调色）、
   不透明度（默认 100%），粗细固定 1px。
   两端以 body:not(.is-mobile) / body.is-mobile 区分：同一份设置在不同设备上按各自配置生效。
   选择器里的 .metadata-container / .metadata-content 是 Obsidian 自身的结构类名
   （属性区即 frontmatter 区），属目标 DOM，不随插件命名调整。 */
body.style-tweaker-properties-column:not(.is-mobile) {
  .metadata-container {
    .metadata-content:not(:is(body.is-grabbing .metadata-content:hover)) {
      display: block;
      column-count: var(--style-tweaker-properties-column-count-desktop, 2);
      column-rule: 1px var(--style-tweaker-properties-divider-style-desktop, dashed)
        color-mix(
          in srgb,
          var(--style-tweaker-properties-divider-color-desktop, var(--color-accent))
            var(--style-tweaker-properties-divider-opacity-desktop, 100%),
          transparent
        );
    }
  }
}

body.style-tweaker-properties-column.is-mobile {
  .metadata-container {
    .metadata-content:not(:is(body.is-grabbing .metadata-content:hover)) {
      display: block;
      column-count: var(--style-tweaker-properties-column-count-mobile, 1);
      column-rule: 1px var(--style-tweaker-properties-divider-style-mobile, dashed)
        color-mix(
          in srgb,
          var(--style-tweaker-properties-divider-color-mobile, var(--color-accent))
            var(--style-tweaker-properties-divider-opacity-mobile, 100%),
          transparent
        );
    }
  }
}
`;
