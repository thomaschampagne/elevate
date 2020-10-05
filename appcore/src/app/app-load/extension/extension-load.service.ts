import { Inject, Injectable } from "@angular/core";
import { AppLoadService } from "../app-load.service";
import { DataStore } from "../../shared/data-store/data-store";

@Injectable()
export class ExtensionLoadService extends AppLoadService {
    constructor(@Inject(DataStore) protected readonly dataStore: DataStore<object>) {
        super(dataStore);
    }

    public loadApp(): Promise<void> {
        return Promise.resolve();
    }
}
