import { ElevateException } from "./elevate.exception";

export class InconsistentParametersException extends ElevateException {
  constructor(message: string = null) {
    super(message);
  }
}
