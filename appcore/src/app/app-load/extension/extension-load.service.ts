import { Inject, Injectable } from "@angular/core";
import { AppLoadService } from "../app-load.service";
import { DataStore } from "../../shared/data-store/data-store";
import { sleep } from "@elevate/shared/tools";

@Injectable()
export class ExtensionLoadService extends AppLoadService {
  protected readonly SPLASH_SCREEN_MIN_TIME_DISPLAYED: number = 750;

  constructor(@Inject(DataStore) protected readonly dataStore: DataStore<object>) {
    super(dataStore);
  }

  public loadApp(): Promise<void> {
    return sleep(this.SPLASH_SCREEN_MIN_TIME_DISPLAYED);
  }
}
