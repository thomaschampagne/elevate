import { ElevateException } from "./elevate.exception";

export class WarningException extends ElevateException {
  constructor(
    message: string,
    public duration: number = null,
    public actionName: string = null,
    public onAction: () => void = null
  ) {
    super(message);
  }
}
