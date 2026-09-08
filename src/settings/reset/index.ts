import { Setting, SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { DEFAULT_SETTINGS, SettingTabPlugin } from "../../types/settings";
import { ConfirmModal } from "../../ui/confirm-modal";

// ============================================================
// 全局重置（所有分组之外固定项）
// ============================================================
export function buildResetSection(
  plugin: SettingTabPlugin,
  update: () => void
): SettingDefinitionItem {
  return {
    type: "page",
    name: t("reset.name"),
    desc: t("reset.desc"),
    items: [
      {
        name: t("reset.defaults"),
        desc: t("reset.defaults.desc"),
        render: (setting: Setting) => {
          setting
            .setName(t("reset.defaults"))
            .setDesc(t("reset.defaults.desc"))
            .addButton((btn) =>
              btn
                .setButtonText(t("reset.button"))
                .setCta()
                .setDestructive()
                .onClick(() => {
                  new ConfirmModal(
                    plugin.app,
                    t("reset.defaults"),
                    t("reset.confirm"),
                    async () => {
                      plugin.settings = { ...DEFAULT_SETTINGS };
                      await plugin.saveSettings();
                      update();
                    },
                  ).open();
                }),
            );
        },
      },
    ],
  };
}
