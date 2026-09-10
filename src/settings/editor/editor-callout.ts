import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：提示块（callouts 样式）
export function buildCalloutsItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.callout.name"),
    desc: t("editor.callout.desc"),
    items: [
      {
        name: t("editor.callout.style"),
        desc: t("editor.callout.style.desc"),
        control: {
          type: "dropdown",
          key: "calloutStyle",
          options: {
            default: t("editor.callout.style.default"),
            "accent-bar": t("editor.callout.style.accentBar"),
            sleek: t("editor.callout.style.sleek"),
            split: t("editor.callout.style.split"),
            outline: t("editor.callout.style.outline"),
            minimal: t("editor.callout.style.minimal"),
            soft: t("editor.callout.style.soft"),
            windows: t("editor.callout.style.windows"),
          },
        },
      },
      {
        name: t("editor.callout.customRadius"),
        desc: t("editor.callout.customRadius.desc"),
        control: {
          type: "toggle",
          key: "calloutCustomRadius",
        },
      },
      {
        name: t("editor.callout.radius"),
        desc: t("editor.callout.radius.desc"),
        visible: () => plugin.settings.calloutCustomRadius,
        control: {
          type: "slider",
          key: "calloutRadius",
          min: 4,
          max: 16,
          step: 1,
          unit: "px",
        },
      },
    ],
  };
}
