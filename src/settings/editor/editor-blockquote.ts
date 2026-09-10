import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：引用块（块引用样式与自定义颜色）
export function buildBlockquoteItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.blockquote.name"),
    desc: t("editor.blockquote.desc"),
    items: [
      {
        name: t("editor.blockquote.style"),
        desc: t("editor.blockquote.style.desc"),
        control: {
          type: "dropdown",
          key: "blockquoteStyle",
          options: {
            default: t("editor.blockquote.style.default"),
            "accent-fill": t("editor.blockquote.style.accentFill"),
            "quotation-mark": t("editor.blockquote.style.quotationMark"),
            bubble: t("editor.blockquote.style.bubble"),
            frame: t("editor.blockquote.style.frame"),
          },
        },
      },
      {
        name: t("editor.blockquote.custom"),
        desc: t("editor.blockquote.custom.desc"),
        control: {
          type: "toggle",
          key: "blockquoteCustom",
        },
      },
      {
        name: t("editor.blockquote.borderColor"),
        desc: t("editor.blockquote.borderColor.desc"),
        visible: () => plugin.settings.blockquoteCustom,
        control: {
          type: "dropdown",
          key: "blockquoteBorderColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.blockquote.textColor"),
        desc: t("editor.blockquote.textColor.desc"),
        visible: () => plugin.settings.blockquoteCustom,
        control: {
          type: "dropdown",
          key: "blockquoteTextColor",
          options: getAccentColorOptions(),
        },
      },
    ],
  };
}
