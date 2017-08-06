export class NotImplemented extends Error {
    constructor(message: string) {
        super("NotImplemented " + message);
    }
}