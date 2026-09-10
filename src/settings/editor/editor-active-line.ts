import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：活动行（光标所在行高亮）
// 结构：总开关 → 高亮颜色 / 行号高亮 / 边框高亮 / 背景高亮 → 背景强度（仅开启背景高亮时显示）
export function buildActiveLineItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.activeLine.name"),
    desc: t("editor.activeLine.desc"),
    items: [
      {
        name: t("editor.activeLine.enabled"),
        desc: t("editor.activeLine.enabled.desc"),
        control: {
          type: "toggle",
          key: "activeLineEnabled",
        },
      },
      {
        name: t("editor.activeLine.color"),
        desc: t("editor.activeLine.color.desc"),
        visible: () => plugin.settings.activeLineEnabled,
        control: {
          type: "dropdown",
          key: "activeLineColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.activeLine.gutter"),
        desc: t("editor.activeLine.gutter.desc"),
        visible: () => plugin.settings.activeLineEnabled,
        control: {
          type: "toggle",
          key: "activeLineGutter",
        },
      },
      {
        name: t("editor.activeLine.border"),
        desc: t("editor.activeLine.border.desc"),
        visible: () => plugin.settings.activeLineEnabled,
        control: {
          type: "toggle",
          key: "activeLineBorder",
        },
      },
      {
        name: t("editor.activeLine.bg"),
        desc: t("editor.activeLine.bg.desc"),
        visible: () => plugin.settings.activeLineEnabled,
        control: {
          type: "toggle",
          key: "activeLineBg",
        },
      },
      {
        name: t("editor.activeLine.focused"),
        desc: t("editor.activeLine.focused.desc"),
        visible: () =>
          plugin.settings.activeLineEnabled && plugin.settings.activeLineBg,
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
          plugin.settings.activeLineEnabled && plugin.settings.activeLineBg,
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
