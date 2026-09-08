import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：任务（复选框颜色与样式）
export function buildTasksItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.task.name"),
    desc: t("editor.task.desc"),
    items: [
      {
        name: t("editor.task.customColors"),
        desc: t("editor.task.customColors.desc"),
        control: {
          type: "toggle",
          key: "taskCustomColors",
        },
      },
      {
        name: t("editor.task.indentColor"),
        desc: t("editor.task.indentColor.desc"),
        visible: () => plugin.settings.taskCustomColors,
        control: {
          type: "dropdown",
          key: "taskIndentColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.task.activeIndentColor"),
        desc: t("editor.task.activeIndentColor.desc"),
        visible: () => plugin.settings.taskCustomColors,
        control: {
          type: "dropdown",
          key: "taskActiveIndentColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.task.checkboxColor"),
        desc: t("editor.task.checkboxColor.desc"),
        visible: () => plugin.settings.taskCustomColors,
        control: {
          type: "dropdown",
          key: "taskCheckboxColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.task.removeStrikethrough"),
        desc: t("editor.task.removeStrikethrough.desc"),
        control: {
          type: "toggle",
          key: "taskRemoveStrikethrough",
        },
      },
    ],
  };
}
