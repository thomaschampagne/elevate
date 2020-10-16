export class ConfirmDialogDataModel {
  public title: string;
  public content: string;
  public confirmText?: string | boolean;
  public cancelText?: string | boolean;

  constructor(title: string, content: string, confirmText?: string | boolean, cancelText?: string | boolean) {
    this.title = title;
    this.content = content;
    this.confirmText = confirmText;
    this.cancelText = cancelText;
  }
}
