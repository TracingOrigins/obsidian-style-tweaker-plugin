import { SettingControl, SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：表格（样式 / 配色及其不透明度 / 边框 / 全宽 / 行号）
export function buildTablesItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  // 基础表格样式只在 tableStyle 非 default 时生效，配色项随之显示
  const hasStyle = (): boolean => {
    const style = plugin.settings.tableStyle;
    return !!style && style !== "default";
  };
  // 学术三线表：表头与条纹全透明，只有悬浮色生效
  const usesAcademia = (): boolean => plugin.settings.tableStyle === "academia";
  // 表头底色：风格一/二/三生效
  const usesHeader = (): boolean => hasStyle() && !usesAcademia();
  // 交替底色：风格一无交替色、三线表全透明，故这两者不显示
  const usesStripe = (): boolean => usesHeader() && plugin.settings.tableStyle !== "one";
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
        name: t("editor.table.headerColor"),
        desc: t("editor.table.headerColor.desc"),
        visible: usesHeader,
        // allowCustom：在预设色板下拉末尾追加「自定义」项，选中后展开下方颜色选择器
        control: {
          type: "color",
          key: "tableHeaderColor",
          allowCustom: true,
        } as unknown as SettingControl,
      },
      {
        // 颜色选择「自定义」后展开：原生颜色选择器（值为 #rrggbb）
        name: t("editor.table.headerColorCustom"),
        desc: t("editor.table.headerColorCustom.desc"),
        visible: () => usesHeader() && plugin.settings.tableHeaderColor === "custom",
        control: {
          type: "color-picker",
          key: "tableCustomHeaderColor",
        } as unknown as SettingControl,
      },
      {
        name: t("editor.table.headerColorOpacity"),
        desc: t("editor.table.headerColorOpacity.desc"),
        visible: usesHeader,
        control: {
          type: "slider",
          key: "tableHeaderColorOpacity",
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
        },
      },
      {
        name: t("editor.table.backgroundColor"),
        desc: t("editor.table.backgroundColor.desc"),
        visible: usesStripe,
        control: {
          type: "color",
          key: "tableBackgroundColor",
          allowCustom: true,
        } as unknown as SettingControl,
      },
      {
        name: t("editor.table.backgroundColorCustom"),
        desc: t("editor.table.backgroundColorCustom.desc"),
        visible: () => usesStripe() && plugin.settings.tableBackgroundColor === "custom",
        control: {
          type: "color-picker",
          key: "tableCustomBackgroundColor",
        } as unknown as SettingControl,
      },
      {
        name: t("editor.table.backgroundColorOpacity"),
        desc: t("editor.table.backgroundColorOpacity.desc"),
        visible: usesStripe,
        control: {
          type: "slider",
          key: "tableBackgroundColorOpacity",
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
        },
      },
      {
        name: t("editor.table.hoverColor"),
        desc: t("editor.table.hoverColor.desc"),
        visible: hasStyle,
        control: {
          type: "color",
          key: "tableHoverColor",
          allowCustom: true,
        } as unknown as SettingControl,
      },
      {
        name: t("editor.table.hoverColorCustom"),
        desc: t("editor.table.hoverColorCustom.desc"),
        visible: () => hasStyle() && plugin.settings.tableHoverColor === "custom",
        control: {
          type: "color-picker",
          key: "tableCustomHoverColor",
        } as unknown as SettingControl,
      },
      {
        name: t("editor.table.hoverColorOpacity"),
        desc: t("editor.table.hoverColorOpacity.desc"),
        visible: hasStyle,
        control: {
          type: "slider",
          key: "tableHoverColorOpacity",
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
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
