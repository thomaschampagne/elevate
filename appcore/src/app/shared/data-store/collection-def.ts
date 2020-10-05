export class CollectionDef<T> {

    public readonly name: string;

    public options: Partial<CollectionOptions<T>>;

    constructor(name: string, options: Partial<CollectionOptions<T>>) {
        this.name = name;
        this.options = options;
    }
}
