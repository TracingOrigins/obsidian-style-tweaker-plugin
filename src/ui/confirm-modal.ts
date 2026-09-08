import { App, Modal } from "obsidian";
import { t } from "../utils/i18n";

// 通用确认弹窗：标题 + 提示 + 确认回调。
export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private title: string,
    private message: string,
    private onConfirm: () => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    titleEl.setText(this.title);
    contentEl.createEl("p", { text: this.message });
    const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });

    const cancelBtn = btnContainer.createEl("button", { text: t("cancel") });
    cancelBtn.addEventListener("click", () => this.close());

    const confirmBtn = btnContainer.createEl("button", {
      cls: "mod-warning",
      text: t("reset.button"),
    });
    confirmBtn.addEventListener("click", () => {
      void this.onConfirm();
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
