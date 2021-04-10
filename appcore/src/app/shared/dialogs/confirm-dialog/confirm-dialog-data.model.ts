import { ThemePalette } from "@angular/material/core";

export class ConfirmDialogDataModel {
  public title: string | null;
  public content: string;
  public confirmText?: string | boolean;
  public confirmColor?: ThemePalette;
  public cancelText?: string | boolean;
  public confirmTimeout?: number;
  public confirmTimeoutEnded?: () => void;

  constructor(
    title: string,
    content: string,
    confirmText?: string | boolean,
    confirmColor?: ThemePalette,
    cancelText?: string | boolean,
    confirmTimeout: number = 0,
    confirmTimeoutEnded: () => void = () => {}
  ) {
    this.title = title;
    this.content = content;
    this.confirmText = confirmText;
    this.confirmColor = confirmColor;
    this.cancelText = cancelText;
    this.confirmTimeout = confirmTimeout;
    this.confirmTimeoutEnded = confirmTimeoutEnded;
  }
}
