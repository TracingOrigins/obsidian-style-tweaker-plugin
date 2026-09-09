/**
 * 属性区域（Properties / Frontmatter）样式模板。
 *
 * 原为 src/styles/editor/properties.css，因 column-count/column-rule 会被
 * no-unsupported-browser-features（旧基线 Electron 39）误报为「部分支持」，
 * 故迁入 TS 由 EditorPropertiesService 运行时注入，样式内容完全不变。
 */

export const PROPERTIES_STYLES_CSS = `
/* 属性名称输入框默认透明 */
input.metadata-property-key-input {
  background: transparent;
}

/* 属性区域分栏布局
   门控类 .style-tweaker-metadata-column 由 EditorPropertiesService 注入，
   栏数由 --style-tweaker-metadata-column-count 控制（默认 2）。 */
body.style-tweaker-metadata-column {
  .metadata-container {
    .metadata-content:not(:is(body.is-grabbing .metadata-content:hover)) {
      display: block;
      column-count: var(--style-tweaker-metadata-column-count, 2);
      column-rule: 1px dashed var(--metadata-border-color);
    }
  }
}
`;
