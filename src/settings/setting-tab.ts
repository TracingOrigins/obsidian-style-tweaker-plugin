import { App, Plugin, PluginSettingTab, Setting, TFile, setIcon } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";

import { t } from "../utils/i18n";
import { SettingTabPlugin, DEFAULT_SETTINGS } from "../types/settings";
import { buildAppearanceSection } from "./appearance";
import { buildInterfaceSection } from "./interface";
import { buildEditorSection } from "./editor";
import { buildPluginsSection } from "./plugin";
import { buildNewTabSection } from "./newtab";
import { buildResetSection } from "./reset";
import { FolderSuggest } from "../ui/folder-suggest";
import { FontSuggest } from "../ui/font-suggest";
import { ImagePicker } from "../ui/image-picker";
import { IconSuggest } from "../ui/icon-suggest";
import { IconPicker } from "../ui/icon-picker";
import { getSortedBackgroundImages } from "../utils/background-images";
import { getAccentColorOptions, normalizeHexColor } from "../utils/color-palette";
import { getFontFamilies, loadSystemFonts } from "../utils/system-fonts";

export class StyleTweakerSettingTab extends PluginSettingTab {
  plugin: SettingTabPlugin;
  icon: string = "palette";

  constructor(app: App, plugin: Plugin) {
    super(app, plugin);
    this.plugin = plugin as SettingTabPlugin;
    // 命令/定时器切换壁纸后，设置面板的「背景图片」预览需刷新。
    // 命令修改的是索引字段，file 控件不感知，故由 BackgroundService 派发事件、此处全量重建。
    // 自定义事件名不在 Obsidian 的 workspace 内置事件字面量中，需绕过类型限制。
    (this.app.workspace as unknown as {
      on(name: string, cb: (...args: unknown[]) => void): unknown;
      off(name: string, cb: (...args: unknown[]) => void): void;
    }).on("style-tweaker:wallpaper-changed", this.onWallpaperChanged);
  }

  /** 壁纸索引变更（命令/定时器切换）→ 重建面板刷新预览。 */
  private onWallpaperChanged = (): void => {
    this.update();
  };

  hide(): void {
    (this.app.workspace as unknown as {
      on(name: string, cb: (...args: unknown[]) => void): unknown;
      off(name: string, cb: (...args: unknown[]) => void): void;
    }).off("style-tweaker:wallpaper-changed", this.onWallpaperChanged);
    super.hide();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const defs = [
      buildAppearanceSection(this.plugin),
      buildInterfaceSection(this.plugin),
      buildEditorSection(this.plugin),
      buildNewTabSection(this.plugin),
      buildPluginsSection(this.plugin),
      buildResetSection(this.plugin, () => this.update()),
    ];
    // 为每个带 control 的设置项包装命令式 render：前置「恢复默认值」按钮，
    // 再渲染原生控件。声明式 control API 无每行额外按钮能力，故采用本方案。
    this.wrapWithReset(defs);
    return defs;
  }

  getControlValue(key: string): unknown {
    return (this.plugin.settings as unknown as Record<string, unknown>)[key];
  }

  /**
   * 更新某个设置值并持久化。
   *
   * 值改变后仅调用 Obsidian 提供的 refreshDomState() 原地更新依赖 visible 的联动项
   * （切换 CSS 状态，不重建 DOM），绝不重渲染整个面板。这样下拉框/开关/滑块等控件
   * 在键盘连续操作（如方向键切换下拉选项）时不会被重建、焦点不丢失。
   */
  setControlValue(key: string, value: unknown): void | Promise<void> {
    (this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
    const p = this.plugin.saveSettings(); // 修改后立即生效
    // 壁纸模式字段：切换会影响「背景图片」选择器的可见性与内容（其预览/索引随模式联动，
    // 而 refreshDomState 只切 CSS 可见性不重渲染，导致切回手动时预览仍显示旧索引的图）。
    // 因此对模式字段做全量重建，使 file 控件重新渲染并读取最新索引与文件夹。
    // 新标签页的联动字段同理：徽标来源/粒子开关/粒子颜色开关/标题类型会增删分组内的
    // 自定义控件（logo-code / logo-image / 颜色选择等），需全量重建以渲染或移除专属控件。
    // 键名含平台前缀（desktopNewTab* / mobileNewTab*），故用 (desktop|mobile) 前缀匹配。
    if (
      /WallpaperMode/.test(key) ||
      /^vaultName(?:Font|Color)InFileList$/.test(key) ||
      /^(?:desktop|mobile)NewTab(?:LogoType|ParticleEnabled|ParticleCustomColor|TitleType)$/.test(key)
    ) {
      this.update();
    } else {
      // 联动项（visible/disabled）用轻量 refreshDomState 更新，避免 update() 全量重建面板。
      this.refreshDomState();
    }
    return p;
  }

  /**
   * 递归遍历设置定义，为所有带 control 的项转换为命令式 render 项：
   * 移除 control 字段（与 render 互斥），保留 name/desc/visible，并渲染「恢复默认值」按钮。
   * 声明式 control API 无每行额外按钮能力，故采用命令式 render。
   */
  private wrapWithReset(items: SettingDefinitionItem[]): void {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const anyItem = item as unknown as { control?: unknown; items?: SettingDefinitionItem[] };
      if (anyItem.control) {
        // 转为命令式 render 项：移除 control，仅保留名称/描述/可见性，交由 render 接管控件区
        const { control: _control, ...rest } = item as unknown as Record<string, unknown>;
        items[i] = {
          ...rest,
          render: (setting: Setting) => this.renderControlItem(item, setting),
        } as unknown as SettingDefinitionItem;
      }
      const nested = (item as unknown as { items?: SettingDefinitionItem[] }).items;
      if (nested) this.wrapWithReset(nested);
    }
  }

  /** 将设置值安全地转为字符串（null/undefined 返回空串，避免 String 对象变成 "[object Object]"） */
  private asString(v: unknown): string {
    switch (typeof v) {
      case "string":
        return v;
      case "number":
      case "boolean":
      case "bigint":
        return String(v);
      default:
        return "";
    }
  }

  /** 命令式渲染单个控制项：前置恢复按钮 + 原生控件 */
  private renderControlItem(item: SettingDefinitionItem, setting: Setting): void {
    const ctrl = (item as unknown as { control: Record<string, unknown> }).control;
    const key = (ctrl).key as string;
    const settings = this.plugin.settings as unknown as Record<string, unknown>;

    let comp: { setValue: (v: unknown) => void } | null = null;

    // 恢复按钮（位于控件左侧）
    setting.addExtraButton((btn) =>
      btn
        .setIcon("rotate-ccw")
        .setTooltip(t("common.restoreDefault"))
        .onClick(async () => {
          const def = (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[key];
          await this.setControlValue(key, def); // 内部已 saveSettings + refreshDomState 联动刷新
          // 颜色项恢复默认（空值=跟随主题）时，用主题强调色兜底显示，避免颜色块变黑
          const display =
            ctrl.type === "color" && !this.asString(def).trim()
              ? this.getThemeAccent()
              : (def as never);
          comp?.setValue(display);
        }),
    );

    switch (ctrl.type) {
      case "slider": {
        setting.addSlider((s) => {
          comp = s as unknown as { setValue: (v: unknown) => void };
          s.setLimits(
            (ctrl.min as number) ?? 0,
            (ctrl.max as number) ?? 100,
            (ctrl.step as number) ?? 1,
          )
            .setValue(settings[key] as number)
            // 可选单位后缀（如 "%"、"px"）：带单位时以内联文本显示当前值
            .setDisplayFormat((v) => `${v}${(ctrl.unit as string) ?? ""}`)
            .onChange((v) => this.setControlValue(key, v));
        });
        break;
      }
      case "toggle": {
        setting.addToggle((t) => {
          comp = t as unknown as { setValue: (v: unknown) => void };
          t.setValue(Boolean(settings[key])).onChange((v) =>
            this.setControlValue(key, v),
          );
        });
        break;
      }
      case "dropdown": {
        setting.addDropdown((d) => {
          comp = d as unknown as { setValue: (v: unknown) => void };
          const opts = (ctrl.options as Record<string, string>) ?? {};
          for (const [val, label] of Object.entries(opts)) d.addOption(val, label);
          d.setValue(String(settings[key])).onChange((v) =>
            this.setControlValue(key, v),
          );
          // 设置项内方向键优先切换下拉框选项，而非 Obsidian 默认的"跳到下一个设置项"导航。
          // 前提是焦点落在当前设置项内；若焦点已在 select 本身，则交给原生 select 处理（不重复干预）。
          const selectEl = d.selectEl;
          const settingEl = setting.settingEl;
          settingEl.addEventListener(
            "keydown",
            (e) => {
              const k = e.key;
              const isArrow =
                k === "ArrowUp" ||
                k === "ArrowDown" ||
                k === "ArrowLeft" ||
                k === "ArrowRight";
              if (!isArrow) return;
              const ae = selectEl.ownerDocument.activeElement;
              if (!settingEl.contains(ae) || ae === selectEl) return;
              const options = selectEl.options;
              if (!options.length) return;
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              const up = k === "ArrowUp" || k === "ArrowLeft";
              selectEl.selectedIndex =
                (selectEl.selectedIndex + (up ? -1 : 1) + options.length) %
                options.length;
              selectEl.dispatchEvent(new Event("change", { bubbles: true }));
            },
            true,
          );
        });
        break;
      }
      case "color": {
        // 颜色选项统一用 accent 色板下拉：default=跟随主题/默认，其余为预设色名。
        // 存量旧数据若是不在色板中的 hex，回退到 default 显示。
        // allowCustom=true 时在末尾追加「自定义」项，选中后由调用方另行展开颜色选择器项。
        setting.addDropdown((d) => {
          comp = d as unknown as { setValue: (v: unknown) => void };
          const options = getAccentColorOptions();
          if (ctrl.allowCustom) options.custom = t("common.custom");
          for (const [val, label] of Object.entries(options)) d.addOption(val, label);
          const cur = this.asString(settings[key]).trim();
          d.setValue(options[cur] ? cur : "default").onChange((v) =>
            this.setControlValue(key, v),
          );
        });
        break;
      }
      case "color-picker": {
        // 自定义颜色：原生颜色选择器 + hex 文本框（双向同步），存储值为 #rrggbb。
        // 空值 / 非法值时选择器回退显示主题强调色，避免初始呈现为黑色。
        const key_ = key;
        const wrap = setting.controlEl.createDiv("style-tweaker-color-picker");
        const picker = wrap.createEl("input", {
          type: "color",
          cls: "style-tweaker-color-picker-input",
        });
        const text = wrap.createEl("input", {
          type: "text",
          cls: "style-tweaker-color-picker-hex",
        });

        // 写入颜色：save=true 时落盘；非法输入则不写入、文本框回退为当前生效值。
        // 不调用 setControlValue：颜色变化不需要联动其它设置项的可见性，
        // 且 refreshDomState 会打断正在拖拽的选择器。
        const apply = (value: string, save: boolean): void => {
          const hex = normalizeHexColor(value);
          if (!hex) {
            if (save) text.value = picker.value;
            return;
          }
          picker.value = hex;
          text.value = hex;
          if (save) {
            settings[key_] = hex;
            void this.plugin.saveSettings();
          }
        };

        apply(
          this.toHexColor(this.asString(settings[key_])) ??
            this.toHexColor(this.getThemeAccent()) ??
            "#000000",
          false,
        );

        // 拖拽/点选颜色实时生效；文本输入在回车或失焦时提交，避免中间态写入
        picker.addEventListener("input", () => apply(picker.value, true));
        text.addEventListener("change", () => apply(text.value, true));
        text.addEventListener("keydown", (e) => {
          if (e.key === "Enter") apply(text.value, true);
        });

        // 恢复默认值（空）→ 回退显示主题强调色
        comp = {
          setValue: (v: unknown) => {
            apply(
              this.toHexColor(this.asString(v)) ??
                this.toHexColor(this.getThemeAccent()) ??
                "#000000",
              false,
            );
          },
        };
        break;
      }
      case "font": {
        // 字体：文本框 + 系统字体搜索建议（可下拉选择，也可自由输入任意字体名）。
        // 候选来源见 utils/system-fonts（优先 queryLocalFonts，回退内置常见字体探测）。
        // 输入过程中仅保存、不重渲染面板，避免刷新导致建议框被关闭、焦点丢失。
        setting.addText((t) => {
          comp = t as unknown as { setValue: (v: unknown) => void };
          const inputEl = (t as unknown as { inputEl: HTMLInputElement }).inputEl;
          t.setValue(this.asString(settings[key])).onChange((v) => {
            settings[key] = v;
            void this.plugin.saveSettings();
          });
          if (inputEl) {
            // 支持占位提示文字：空值输入框展示 placeholder 引导用户
            const ph = (ctrl).placeholder as string | undefined;
            if (ph) inputEl.placeholder = ph;
            // 用户手势中触发完整字体枚举（权限/时序上更稳），结果供后续输入使用
            inputEl.addEventListener("focus", () => {
              void loadSystemFonts();
            });
            new FontSuggest(this.app, inputEl, () => getFontFamilies(), (font) => {
              settings[key] = font;
              void this.plugin.saveSettings();
            });
          }
        });
        break;
      }
      case "folder": {
        // 文件夹：边输入边搜索 vault 内文件夹的下拉建议框
        setting.addText((t) => {
          comp = t as unknown as { setValue: (v: unknown) => void };
          t
            .setPlaceholder("Vault path, e.g. Images/wallpapers")
            .setValue(this.asString(settings[key]))
            // 输入过程中仅保存、不重渲染，避免焦点丢失。
            // 直接写 settings + saveSettings，不走 setControlValue 的 refreshDomState()，
            // 避免在建议框选择时抛错中断 Obsidian 对 AbstractInputSuggest 的自动关闭。
            .onChange((v) => {
              (settings)[key] = v;
              void this.plugin.saveSettings();
            });
          new FolderSuggest(this.app, t.inputEl, (path) => {
            (settings)[key] = path;
            void this.plugin.saveSettings();
            // 壁纸文件夹字段：选择后全量重建，让「背景图片」选择器读取新文件夹并刷新预览。
            if (/WallpaperFolder/.test(key)) this.update();
          });
        });
        break;
      }
      case "file": {
        // 壁纸手动模式：预览当前索引对应的图片，上一张/下一张/搜索修改的是「索引」字段。
        // key 为索引字段（如 desktopWallpaperIndexDark），folderKey 指向该套壁纸文件夹字段，
        // 图池取自该文件夹，选中后把索引写回 settings[key]，从而实现"手动选择一张背景图"。
        const indexVal = Number(settings[key]) || 0;
        const folderKey = (ctrl.folderKey as string) ?? "";
        // 预览比例按「字段所属设备」决定：mobileWallpaper*（移动端背景）字段显示竖屏比例，
        // 桌面字段保持 16:9 横屏，与当前在哪台设备上查看设置无关。
        const isMobileField = /^mobile/.test(key);
        // 文件夹每次调用时实时读取：用户可能在本控件渲染之后才设置壁纸文件夹，
        // 若用渲染时捕获的常量，后续配置文件夹后 getImages 仍是空。
        const getImages = (): TFile[] => {
          const folder = this.asString((settings)[folderKey]).trim();
          // 图池与背景服务保持一致：文件夹未配置时不扫描整个仓库，
          // 否则预览/搜索会显示全库图片，而实际生效的壁纸却是空（不一致）。
          return folder ? getSortedBackgroundImages(this.app, folder) : [];
        };
        const normalize = (n: number, len: number): number =>
          len <= 0 ? 0 : ((n % len) + len) % len;

        // 当前索引对应的图片路径（无图或文件夹未配置时为空）
        const images0 = getImages();
        const currentPath =
          images0.length > 0 ? images0[normalize(indexVal, images0.length)].path : "";

        // 预览缩略图：显示当前索引对应的图片（移动端背景字段加竖屏标记）
        const preview = setting.controlEl.createDiv({
          cls:
            "style-tweaker-image-preview" +
            (isMobileField ? " is-mobile-field" : ""),
        });
        const thumb = preview.createEl("img");
        const updateThumb = (path: string) => {
          if (path) {
            thumb.src = this.app.vault.adapter.getResourcePath(path);
            preview.removeClass("is-empty");
          } else {
            thumb.removeAttribute("src");
            preview.addClass("is-empty");
          }
        };
        updateThumb(currentPath);

        // 更新索引：写回 settings[key]、保存并刷新预览。
        // 不调用 setControlValue：ImagePicker 选中后 refreshDomState() 可能中断弹窗自动关闭。
        const applyIndex = (idx: number) => {
          const images = getImages();
          if (images.length === 0) return;
          const norm = normalize(idx, images.length);
          (settings)[key] = norm;
          void this.plugin.saveSettings();
          updateThumb(images[norm].path);
        };

        // 上一张 / 下一张：在文件夹图池中按索引步进（循环）
        const step = (direction: 1 | -1): void => {
          const images = getImages();
          if (images.length === 0) return;
          const cur = normalize(Number(settings[key]) || 0, images.length);
          applyIndex(cur + direction);
        };

        const prevBtn = setting.controlEl.createEl("button", {
          cls: "clickable-icon style-tweaker-image-nav",
        });
        setIcon(prevBtn, "arrow-left");
        prevBtn.setAttribute("aria-label", t("common.image.prev"));
        prevBtn.addEventListener("click", () => step(-1));

        const nextBtn = setting.controlEl.createEl("button", {
          cls: "clickable-icon style-tweaker-image-nav",
        });
        setIcon(nextBtn, "arrow-right");
        nextBtn.setAttribute("aria-label", t("common.image.next"));
        nextBtn.addEventListener("click", () => step(1));

        // 搜索按钮：打开图片选择弹窗，选中后把索引设为该图在文件夹中的位置
        setting.addExtraButton((btn) =>
          btn
            .setIcon("search")
            .setTooltip(t("common.image.pick"))
            .onClick(() => {
              const images = getImages();
              const cur = normalize(Number(settings[key]) || 0, images.length);
              const folder = this.asString((settings)[folderKey]).trim();
              new ImagePicker(
                this.app,
                (file: TFile) => images.some((f) => f.path === file.path),
                (path) => {
                  if (!path) return;
                  const idx = images.findIndex((f) => f.path === path);
                  if (idx >= 0) applyIndex(idx);
                },
                images.length > 0 ? images[cur].path : "",
                isMobileField,
                folder,
              ).open();
            }),
        );
        break;
      }
      case "logo-code": {
        // 自定义矢量图标徽标：左侧预览 + 右侧 SVG 代码输入框（无需搜索按钮，仅手动输入）。
        // 存储值为 SVG 代码字符串。
        const key_ = key;
        const wrap = setting.controlEl.createDiv("style-tweaker-logo-code");
        const preview = wrap.createDiv("style-tweaker-logo-preview");
        const input = wrap.createEl("input", {
          type: "text",
          cls: "style-tweaker-logo-code-input",
          value: this.asString(settings[key]),
        });
        input.placeholder = t("newtab.logo.code.placeholder");

        const updatePreview = (value: string): void => {
          preview.empty();
          const trimmed = value.trim();
          if (!trimmed) return;
          // 存储已统一为 SVG 代码：仅当值是 svg 代码时解析预览。
          if (trimmed.includes("<svg")) {
            try {
              let svg: Element | null =
                new DOMParser()
                  .parseFromString(trimmed, "image/svg+xml")
                  .querySelector("svg");
              // 严格 XML 解析失败时用宽松的 HTML 解析兜底
              if (!svg) {
                svg = new DOMParser()
                  .parseFromString(trimmed, "text/html")
                  .querySelector("svg");
              }
              if (svg) preview.appendChild(svg);
            } catch {
              // ignore invalid svg
            }
          }
        };
        updatePreview(this.asString(settings[key]));

        input.addEventListener("input", () => {
          (settings)[key_] = input.value;
          void this.plugin.saveSettings();
          updatePreview(input.value);
        });

        // 恢复默认值（SVG 清空）时更新输入框与预览
        comp = {
          setValue: (v: unknown) => {
            const str = this.asString(v);
            input.value = str;
            updatePreview(str);
          },
        };
        break;
      }
      case "logo-icon": {
        // 内置 lucide 图标徽标：左侧预览 + 图标名输入框（前缀/包含匹配建议）。
        // 存储值为 lucide 图标名称；新标签页用 getIcon(name) 渲染。
        const key_ = key;
        const wrap = setting.controlEl.createDiv("style-tweaker-logo-code");
        const preview = wrap.createDiv("style-tweaker-logo-preview");
        const input = wrap.createEl("input", {
          type: "text",
          cls: "style-tweaker-logo-code-input",
          value: this.asString(settings[key]),
        });
        input.placeholder = t("newtab.logo.icon.placeholder");

        const updatePreview = (name: string): void => {
          preview.empty();
          const trimmed = name.trim();
          if (!trimmed) return;
          setIcon(preview, trimmed);
        };
        updatePreview(this.asString(settings[key]));

        // 唯一的写入链路：确认选中一个图标后写回输入框、保存并刷新预览。
        // 手打输入只用于过滤建议，既不写设置也不动预览——输入的中间态（含打错的
        // 名字，哪怕恰好撞上某个合法图标名）都不该改变徽标；且 saveSettings 会
        // 全量持久化并重注入全部样式服务，逐键保存会拖慢输入。
        const applyPick = (name: string): void => {
          input.value = name;
          (settings)[key_] = name;
          void this.plugin.saveSettings();
          updatePreview(name);
        };

        // 输入即过滤建议（IconSuggest 内置前缀/包含匹配，与搜索弹窗同一套算法）：只有从下拉建议中选定后
        // 才回调 applyPick（trigger("input") 那条老链路已弃用）。
        new IconSuggest(this.app, input, applyPick);

        // 搜索按钮：打开图标网格弹窗浏览全部图标（虚拟滚动，几万项不卡，只显示图标）。
        // 选中后同样走 applyPick 这条唯一写入链路。
        const searchBtn = wrap.createEl("button", {
          cls: "clickable-icon style-tweaker-logo-icon-search",
        });
        setIcon(searchBtn, "search");
        searchBtn.setAttribute("aria-label", t("newtab.logo.icon.searchButton"));
        searchBtn.addEventListener("click", () => {
          new IconPicker(this.app, applyPick).open();
        });

        // 恢复默认值（回退 feather）时更新输入框与预览
        comp = {
          setValue: (v: unknown) => {
            const str = this.asString(v);
            input.value = str;
            updatePreview(str);
          },
        };
        break;
      }
      case "logo-image": {
        // 本地图片徽标：与背景图片 file 控件一致（缩略图预览 + 上/下一张 + 搜索），
        // 索引式存储：key 为图池索引字段，folderKey 指向徽标图片文件夹字段。
        // 索引 -1 表示"未选择"：配置文件夹后不自动展示第一张，恢复默认值也回到该状态。
        const rawIndex = settings[key];
        // 键缺失（首次使用 / 旧版本无该字段）时回退 -1（"未选择"）。
        // 不可写 Number(rawIndex) ?? -1：Number() 恒返回数字，?? 永不生效。
        const indexVal = rawIndex == null ? -1 : Number(rawIndex);
        const folderKey = (ctrl.folderKey as string) ?? "";
        // 移动端徽标（mobileNewTab*）用更小的紧凑方形，桌面徽标保持标准方形。
        const isCompact = key.startsWith("mobile");
        // 图池实时读取：用户可能在本控件渲染后才设置文件夹。
        const getImages = (): TFile[] => {
          const folder = this.asString((settings)[folderKey]).trim();
          // 未配置文件夹时图池为空，与背景图片保持一致
          return folder ? getSortedBackgroundImages(this.app, folder) : [];
        };
        const normalize = (n: number, len: number): number =>
          len <= 0 ? 0 : ((n % len) + len) % len;

        const images0 = getImages();
        // 索引 -1（未选择）时不展示任何图片
        const currentPath =
          indexVal >= 0 && images0.length > 0
            ? images0[normalize(indexVal, images0.length)].path
            : "";

        // 预览缩略图：显示当前索引对应的图片（空态显示占位图标）。
        // 徽标用 1:1 正方形预览（is-square），与徽标实际形态一致；
        // 移动端徽标再加 is-compact 缩小尺寸，避免在小屏设置里显得过大。
        const preview = setting.controlEl.createDiv({
          cls:
            "style-tweaker-image-preview is-square" +
            (isCompact ? " is-compact" : ""),
        });
        const thumb = preview.createEl("img");
        const updateThumb = (path: string) => {
          if (path) {
            thumb.src = this.app.vault.adapter.getResourcePath(path);
            preview.removeClass("is-empty");
          } else {
            thumb.removeAttribute("src");
            preview.addClass("is-empty");
          }
        };
        updateThumb(currentPath);

        const applyIndex = (idx: number) => {
          const images = getImages();
          if (images.length === 0) return;
          const norm = normalize(idx, images.length);
          (settings)[key] = norm;
          void this.plugin.saveSettings();
          updateThumb(images[norm].path);
        };

        // 恢复默认值（索引置 -1）时清空预览，回到"未选择"状态
        comp = {
          setValue: (v: unknown) => {
            const n = Number(v);
            (settings)[key] = n;
            updateThumb(n >= 0 && images0.length > 0 ? images0[normalize(n, images0.length)].path : "");
          },
        };

        const step = (direction: 1 | -1): void => {
          const images = getImages();
          if (images.length === 0) return;
          // 未选择时从第一张开始步进
          const cur =
            Number(settings[key]) >= 0
              ? normalize(Number(settings[key]), images.length)
              : 0;
          applyIndex(cur + direction);
        };

        const prevBtn = setting.controlEl.createEl("button", {
          cls: "clickable-icon style-tweaker-image-nav",
        });
        setIcon(prevBtn, "arrow-left");
        prevBtn.setAttribute("aria-label", t("common.image.prev"));
        prevBtn.addEventListener("click", () => step(-1));

        const nextBtn = setting.controlEl.createEl("button", {
          cls: "clickable-icon style-tweaker-image-nav",
        });
        setIcon(nextBtn, "arrow-right");
        nextBtn.setAttribute("aria-label", t("common.image.next"));
        nextBtn.addEventListener("click", () => step(1));

        setting.addExtraButton((btn) =>
          btn
            .setIcon("search")
            .setTooltip(t("common.image.pick"))
            .onClick(() => {
              const images = getImages();
              const cur =
                Number(settings[key]) >= 0
                  ? normalize(Number(settings[key]), images.length)
                  : 0;
              const folder = this.asString((settings)[folderKey]).trim();
              new ImagePicker(
                this.app,
                (file: TFile) => images.some((f) => f.path === file.path),
                (path) => {
                  if (!path) return;
                  const idx = images.findIndex((f) => f.path === path);
                  if (idx >= 0) applyIndex(idx);
                },
                images.length > 0 ? images[cur].path : "",
                false,
                folder,
                true,
                isCompact,
              ).open();
            }),
        );
        break;
      }
      case "text": {
        setting.addText((t) => {
          comp = t as unknown as { setValue: (v: unknown) => void };
          // 文本输入：每次 onChange 仅保存、不重渲染面板，否则每输入一个字符
          // 都会重建输入框导致焦点丢失、只能输入一个字符。失焦时轻量刷新联动项。
          t
            .setValue(this.asString(settings[key]))
            .onChange((v) => this.setControlValue(key, v));
          const inputEl = (t as unknown as { inputEl: HTMLInputElement }).inputEl;
          if (inputEl) {
            // 支持占位提示文字：空值输入框展示 placeholder 引导用户
            const ph = (ctrl).placeholder as string | undefined;
            if (ph) inputEl.placeholder = ph;
            inputEl.addEventListener("blur", () => this.refreshDomState());
          }
        });
        break;
      }
    }
  }

  /**
   * 任意 CSS 颜色值 → #rrggbb。
   * 先按 hex 直接解析；失败则用挂载的隐藏探针经 getComputedStyle 规范化
   * （可处理 rgb()/hsl()/var() 等形式），仍失败返回 null。
   */
  private toHexColor(value: string): string | null {
    const direct = normalizeHexColor(value);
    if (direct) return direct;
    const raw = (value ?? "").trim();
    if (!raw) return null;
    try {
      const doc = this.app.workspace.containerEl.ownerDocument;
      const probe = doc.body.createDiv();
      // 用 setCssProps 而非直接改 style，规避 obsidianmd/no-static-styles-assignment
      probe.setCssProps({ display: "none", color: raw });
      const computed = getComputedStyle(probe).color;
      probe.remove();
      const m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(computed);
      if (!m) return null;
      const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
      return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
    } catch {
      return null;
    }
  }

  /** 读取主题强调色（--text-accent）的实际色值，用于颜色选择器空值时的默认显示 */
  private getThemeAccent(): string {
    try {
      const doc = this.app.workspace.containerEl.ownerDocument;
      const accent = getComputedStyle(doc.body)
        .getPropertyValue("--text-accent")
        .trim();
      if (accent) return accent;
    } catch {
      // ignore
    }
    return "#000000";
  }
}
