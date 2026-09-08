import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";

// 界面子页：布局（边框 / 卡片布局）
export function buildLayoutItem(): SettingDefinitionItem {
  return {
    type: "page",
    name: t("interface.layout.name"),
    desc: t("interface.layout.desc"),
    items: [
      {
        name: t("interface.layout.mode"),
        desc: t("interface.layout.mode.desc"),
        control: {
          type: "dropdown",
          key: "layoutMode",
          options: {
            default: t("interface.layout.mode.default"),
            border: t("interface.layout.mode.border"),
            cards: t("interface.layout.mode.cards"),
          },
        },
      },
    ],
  };
}
