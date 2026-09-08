import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：活动行（光标所在行高亮）
export function buildActiveLineItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.activeLine.name"),
    desc: t("editor.activeLine.desc"),
    items: [
      {
        name: t("editor.activeLine.mode"),
        desc: t("editor.activeLine.mode.desc"),
        control: {
          type: "dropdown",
          key: "activeLineMode",
          options: {
            none: t("editor.activeLine.mode.none"),
            bg: t("editor.activeLine.mode.bg"),
            "bg-border": t("editor.activeLine.mode.bgBorder"),
            border: t("editor.activeLine.mode.border"),
          },
        },
      },
      {
        name: t("editor.activeLine.color"),
        desc: t("editor.activeLine.color.desc"),
        visible: () => plugin.settings.activeLineMode !== "none",
        control: {
          type: "dropdown",
          key: "activeLineColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.activeLine.focused"),
        desc: t("editor.activeLine.focused.desc"),
        visible: () =>
          plugin.settings.activeLineMode !== "none" &&
          plugin.settings.activeLineMode !== "border",
        control: {
          type: "slider",
          key: "activeLineFocused",
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
        },
      },
      {
        name: t("editor.activeLine.unfocused"),
        desc: t("editor.activeLine.unfocused.desc"),
        visible: () =>
          plugin.settings.activeLineMode !== "none" &&
          plugin.settings.activeLineMode !== "border",
        control: {
          type: "slider",
          key: "activeLineUnfocused",
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
        },
      },
    ],
  };
}
