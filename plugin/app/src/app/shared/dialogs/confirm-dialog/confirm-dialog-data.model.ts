export class ConfirmDialogDataModel {

	public title: string;
	public content: string;
	public confirmText?: string;
	public cancelText?: string;

	constructor(title: string, content: string, confirmText?: string, cancelText?: string) {
		this.title = title;
		this.content = content;
		this.confirmText = confirmText;
		this.cancelText = cancelText;
	}
}
