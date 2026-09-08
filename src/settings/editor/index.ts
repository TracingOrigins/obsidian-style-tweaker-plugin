import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { buildBackgroundItem } from "./editor-background";
import { buildActiveLineItem } from "./editor-active-line";
import { buildInlineTitleItem } from "./editor-inline-title";
import { buildPropertiesItem } from "./editor-properties";
import { buildHeadingsItem } from "./editor-heading";
import { buildTextDecorationItem } from "./editor-text-decoration";
import { buildInlineCodeItem } from "./editor-inline-code";
import { buildCodeBlockItem } from "./editor-code-block";
import { buildHrItem } from "./editor-hr";
import { buildBlockquoteItem } from "./editor-blockquote";
import { buildLinksItem } from "./editor-link";
import { buildEmbedsItem } from "./editor-embed";
import { buildTablesItem } from "./editor-table";
import { buildCalloutsItem } from "./editor-callout";
import { buildListsItem } from "./editor-list";
import { buildTasksItem } from "./editor-task";
import { buildTagsItem } from "./editor-tag";

// ============================================================
// 顶级分组四：编辑器（17 个子页，每个子页一个独立文件）
// ============================================================

export function buildEditorSection(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.name"),
    desc: t("editor.desc"),
    items: [
      buildBackgroundItem(plugin),
      buildActiveLineItem(plugin),
      buildInlineTitleItem(plugin),
      buildPropertiesItem(plugin),
      buildHeadingsItem(plugin),
      buildTextDecorationItem(plugin),
      buildInlineCodeItem(plugin),
      buildCodeBlockItem(plugin),
      buildHrItem(plugin),
      buildBlockquoteItem(plugin),
      buildLinksItem(plugin),
      buildEmbedsItem(plugin),
      buildTablesItem(plugin),
      buildCalloutsItem(plugin),
      buildListsItem(plugin),
      buildTasksItem(plugin),
      buildTagsItem(plugin),
    ],
  };
}
