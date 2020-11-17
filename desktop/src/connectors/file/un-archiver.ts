import { inject, singleton } from "tsyringe";
import { extractFull } from "node-7z";
import { AppService } from "../../app-service";
import path from "path";

@singleton()
export class UnArchiver {
  private static readonly SUPPORTED_FORMAT: string[] = ["zip", "gz", "tar", "7z", "bz2", "zipx", "xz"];
  private static readonly NODE_MODULE_NAME: string = "7zip-bin";
  private readonly _7zBin: string;

  public static isArchiveFile(filename: string) {
    return UnArchiver.SUPPORTED_FORMAT.indexOf(path.extname(filename).slice(1)) !== -1;
  }

  constructor(@inject(AppService) protected readonly appService: AppService) {
    this._7zBin = require(UnArchiver.NODE_MODULE_NAME).path7za;

    if (this.appService.isPackaged) {
      this._7zBin = `${this.appService.getResourceFolder()}/app.asar.unpacked/node_modules/${
        UnArchiver.NODE_MODULE_NAME
      }${this._7zBin.split(UnArchiver.NODE_MODULE_NAME)[1]}`;
    }
  }

  public unpack(pathToArchive: string, destFolder: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const node7z = extractFull(pathToArchive, destFolder, {
        $bin: this._7zBin
      });

      node7z.on("end", () => {
        resolve();
      });

      node7z.on("error", err => {
        reject(err);
      });
    });
  }
}
