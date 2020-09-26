export class ConfirmDialogDataModel {
  public title: string | null;
  public content: string;
  public confirmText?: string | boolean;
  public cancelText?: string | boolean;
  public confirmTimeout?: number;
  public confirmTimeoutEnded?: () => void;

  constructor(
    title: string,
    content: string,
    confirmText?: string | boolean,
    cancelText?: string | boolean,
    confirmTimeout: number = 0,
    confirmTimeoutEnded: () => void = () => {}
  ) {
    this.title = title;
    this.content = content;
    this.confirmText = confirmText;
    this.cancelText = cancelText;
    this.confirmTimeout = confirmTimeout;
    this.confirmTimeoutEnded = confirmTimeoutEnded;
  }
}
