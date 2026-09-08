import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：分割线（---）
export function buildHrItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.hr.name"),
    desc: t("editor.hr.desc"),
    items: [
      {
        name: t("editor.hr.style"),
        desc: t("editor.hr.style.desc"),
        control: {
          type: "dropdown",
          key: "hrStyle",
          options: {
            default: t("editor.hr.style.default"),
            icon: t("editor.hr.style.icon"),
            "no-icon": t("editor.hr.style.noIcon"),
          },
        },
      },
      {
        name: t("editor.hr.centerIcon"),
        desc: t("editor.hr.centerIcon.desc"),
        visible: () => plugin.settings.hrStyle === "icon",
        control: {
          type: "text",
          key: "hrCenterIcon",
        },
      },
      {
        name: t("editor.hr.iconRotate"),
        desc: t("editor.hr.iconRotate.desc"),
        visible: () => plugin.settings.hrStyle === "icon",
        control: {
          type: "slider",
          key: "hrIconRotate",
          min: 0,
          max: 360,
          step: 1,
          unit: "°",
        },
      },
    ],
  };
}
