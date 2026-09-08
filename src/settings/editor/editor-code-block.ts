import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：代码块（行号 / 语言标签）
export function buildCodeBlockItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.codeBlock.name"),
    desc: t("editor.codeBlock.desc"),
    items: [
      {
        name: t("editor.codeBlock.lineNumbers"),
        desc: t("editor.codeBlock.lineNumbers.desc"),
        control: {
          type: "toggle",
          key: "codeBlockLineNumbers",
        },
      },
      {
        name: t("editor.codeBlock.showLang"),
        desc: t("editor.codeBlock.showLang.desc"),
        control: {
          type: "toggle",
          key: "codeBlockShowLang",
        },
      },
      {
        name: t("editor.codeBlock.customRadius"),
        desc: t("editor.codeBlock.customRadius.desc"),
        control: {
          type: "toggle",
          key: "codeBlockCustomRadius",
        },
      },
      {
        name: t("editor.codeBlock.radius"),
        desc: t("editor.codeBlock.radius.desc"),
        visible: () => plugin.settings.codeBlockCustomRadius,
        control: {
          type: "slider",
          key: "codeBlockRadius",
          min: 4,
          max: 16,
          step: 1,
          unit: "px",
        },
      },
    ],
  };
}
