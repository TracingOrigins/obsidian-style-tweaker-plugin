import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：表格（样式 / 边框 / 全宽 / 行号）
export function buildTablesItem(_plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.table.name"),
    desc: t("editor.table.desc"),
    items: [
      {
        name: t("editor.table.style"),
        desc: t("editor.table.style.desc"),
        control: {
          type: "dropdown",
          key: "tableStyle",
          options: {
            default: t("editor.table.style.default"),
            one: t("editor.table.style.one"),
            two: t("editor.table.style.two"),
            three: t("editor.table.style.three"),
            academia: t("editor.table.style.academia"),
          },
        },
      },
      {
        name: t("editor.table.showBorder"),
        desc: t("editor.table.showBorder.desc"),
        control: {
          type: "toggle",
          key: "tableShowBorder",
        },
      },
      {
        name: t("editor.table.fullWidth"),
        desc: t("editor.table.fullWidth.desc"),
        control: {
          type: "toggle",
          key: "tableFullWidth",
        },
      },
      {
        name: t("editor.table.lineNumbers"),
        desc: t("editor.table.lineNumbers.desc"),
        control: {
          type: "toggle",
          key: "tableLineNumbers",
        },
      },
    ],
  };
}
