import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：引用块（引用块样式与自定义颜色）
export function buildBlockquoteItem(plugin: SettingTabPlugin): SettingDefinitionItem {
    return {
        type: "page",
        name: t("editor.blockquote.name"),
        desc: t("editor.blockquote.desc"),
        items: [
            {
                name: t("editor.blockquote.style"),
                desc: t("editor.blockquote.style.desc"),
                control: {
                    type: "dropdown",
                    key: "blockquoteStyle",
                    options: {
                        // 左侧是写入 data.json 的设置值，同时决定 body 门控类名
                        // （style-tweaker-blockquote-<值>），须与 blockquote.css 保持一致
                        default: t("editor.blockquote.style.default"),
                        "color-block": t("editor.blockquote.style.colorBlock"),
                        // 值用 quotation-mark 而非 quote：本文件其余位置与 Obsidian 的
                        // .HyperMD-quote / .cm-quote 已把 quote 用于指代「引用块」本身
                        "quotation-mark": t("editor.blockquote.style.quotationMark"),
                        bubble: t("editor.blockquote.style.bubble"),
                        frame: t("editor.blockquote.style.frame"),
                    },
                },
            },
            {
                name: t("editor.blockquote.customBlockBackground"),
                desc: t("editor.blockquote.customBlockBackground.desc"),
                // 底色是「色块」独有的属性（气泡 / 边框的背景均为透明），故仅在该样式下出现
                visible: () => plugin.settings.blockquoteStyle === "color-block",
                control: {
                    type: "toggle",
                    key: "blockquoteCustomBlockBackground",
                },
            },
            {
                name: t("editor.blockquote.blockBackgroundColor"),
                desc: t("editor.blockquote.blockBackgroundColor.desc"),
                // 两个条件同时满足才显示：色块样式 + 已开启自定义色块底色
                visible: () =>
                    plugin.settings.blockquoteStyle === "color-block" &&
                    plugin.settings.blockquoteCustomBlockBackground,
                control: {
                    type: "dropdown",
                    key: "blockquoteBlockBackgroundColor",
                    options: getAccentColorOptions(),
                },
            },
            {
                name: t("editor.blockquote.customBorder"),
                desc: t("editor.blockquote.customBorder.desc"),
                control: {
                    type: "toggle",
                    key: "blockquoteCustomBorder",
                },
            },
            {
                name: t("editor.blockquote.borderColor"),
                desc: t("editor.blockquote.borderColor.desc"),
                visible: () => plugin.settings.blockquoteCustomBorder,
                control: {
                    type: "dropdown",
                    key: "blockquoteBorderColor",
                    options: getAccentColorOptions(),
                },
            },
            {
                name: t("editor.blockquote.customText"),
                desc: t("editor.blockquote.customText.desc"),
                control: {
                    type: "toggle",
                    key: "blockquoteCustomText",
                },
            },
            {
                name: t("editor.blockquote.textColor"),
                desc: t("editor.blockquote.textColor.desc"),
                visible: () => plugin.settings.blockquoteCustomText,
                control: {
                    type: "dropdown",
                    key: "blockquoteTextColor",
                    options: getAccentColorOptions(),
                },
            },
        ],
    };
}
