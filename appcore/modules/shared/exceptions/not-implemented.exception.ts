import { ElevateException } from "./elevate.exception";

export class NotImplementedException extends ElevateException {
    constructor(message: string = null) {
        super(message);
    }
}
