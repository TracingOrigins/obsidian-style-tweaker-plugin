import "obsidian";

declare module "obsidian" {
  interface SettingSliderControl {
    /**
     * 滑块当前值的单位后缀，用于内联显示，如 "%"、"px"、"°"。
     * 例如 opacity=50、unit="%" 时显示为 "50%"。
     */
    unit?: string;
  }

  interface SettingFileControl {
    /**
     * （扩展）壁纸手动模式专用：该 file 控件绑定的图片来源文件夹字段名。
     * 用于把「背景图片」选择器绑定到索引字段时，从该文件夹取图池。
     */
    folderKey?: string;
  }
}
