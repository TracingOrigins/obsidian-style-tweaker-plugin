import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 界面子页：弹框（按桌面端 / 移动端分组，各自一个「弹框背景模糊」开关）
export function buildModalItem(_plugin: SettingTabPlugin): SettingDefinitionItem {
    return {
        type: "page",
        name: t("interface.modal.name"),
        desc: t("interface.modal.desc"),
        items: [
            {
                type: "group",
                heading: t("interface.modal.group.desktop"),
                items: [
                    {
                        name: t("interface.modal.blur"),
                        desc: t("interface.modal.blur.desc"),
                        control: { type: "toggle", key: "desktopModalBlur" },
                    },
                ],
            },
            {
                type: "group",
                heading: t("interface.modal.group.mobile"),
                items: [
                    {
                        name: t("interface.modal.blur"),
                        desc: t("interface.modal.blur.desc"),
                        control: { type: "toggle", key: "mobileModalBlur" },
                    },
                ],
            },
        ],
    };
}
