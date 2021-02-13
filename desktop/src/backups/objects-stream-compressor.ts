import fs, { WriteStream } from "fs";
import MiniPass from "minipass";
import JSONStream from "JSONStream";
import miniZlib from "minizlib";
import stream from "stream";
import { Subject } from "rxjs";
import { singleton } from "tsyringe";
import { ElevateException } from "@elevate/shared/exceptions";
import logger from "electron-log";

// TODO PR on stream/angular-upgrade
// TODO Rn MessageFlag to SyncMessages?
// TODO Remove pako? Use lz-string for web extension compressed streams?
@singleton()
export class ObjectsStreamCompressor {
  public targetArchivePath: string;
  private archiveWriteStream: WriteStream;
  private compressorStream: stream.Transform;

  /**
   * Receive serialized objects and pipe them into compressor then to the target archive
   */
  private passStream: MiniPass;

  constructor() {}

  private init(): Promise<void> {
    if (!this.targetArchivePath) {
      throw new ElevateException("Missing target archive file");
    }

    logger.debug(`Writing objects to ${this.targetArchivePath} archive.`);
    this.archiveWriteStream = fs.createWriteStream(this.targetArchivePath);
    this.passStream = new MiniPass();
    this.compressorStream = new miniZlib.BrotliCompress();
    this.passStream.pipe(this.compressorStream).pipe(this.archiveWriteStream); // Redirect writes to archiveStream
    return this._write("["); // Start json array
  }

  /**
   * Write and compress an object into the archived compressed stream
   * @param object to compress and append to stream
   * @param isLastObject Tell if this is the last object on which stream will be ended
   * @return Promise of object properly written
   */
  public write(object: object, isLastObject: boolean): Promise<void> {
    const initStream = this.passStream ? Promise.resolve() : this.init();

    return initStream.then(() => {
      const serializedObj = JSON.stringify(object);

      // Is end of stream?
      if (isLastObject) {
        // Write last object and close json array
        return this._write(serializedObj).then(() => {
          return this._end("]");
        });
      } else {
        return this._write(`${serializedObj},`); // Append json object to stream
      }
    });
  }

  /**
   * Trigger objects listening from the archived compressed stream
   * @return Observable emitting every object compressed from archive file.
   */
  public read(): Subject<any> {
    const subject$ = new Subject<any>();

    // Decompress stream from source archive
    const decompressor = new miniZlib.BrotliDecompress();

    const archiveFileStream = fs.createReadStream(this.targetArchivePath);
    const decompressedJsonStream = archiveFileStream.pipe(decompressor).pipe(JSONStream.parse("*"));

    decompressedJsonStream.on("data", object => {
      subject$.next(object);
    });

    decompressedJsonStream.on("end", () => {
      subject$.complete();
      archiveFileStream.close();
    });

    return subject$;
  }

  private _write(data: any): Promise<void> {
    return new Promise(resolve => {
      this.passStream.write(data, null, resolve);
    });
  }

  private _end(data: any): Promise<void> {
    return new Promise(resolve => {
      this.passStream.end(data, null, resolve);
    }).then(() => {
      // Close write stream
      this.passStream.destroy();
      this.compressorStream.destroy();
      this.archiveWriteStream.close();
      this.passStream = null;
      this.compressorStream = null;
      this.archiveWriteStream = null;
      return Promise.resolve();
    });
  }
}
