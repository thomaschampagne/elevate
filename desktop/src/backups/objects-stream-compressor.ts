import fs, { WriteStream } from "fs";
import MiniPass from "minipass";
import JSONStream from "JSONStream";
import miniZlib from "minizlib";
import stream from "stream";
import { Subject } from "rxjs";
import { inject, singleton } from "tsyringe";
import { ElevateException } from "@elevate/shared/exceptions";
import pDefer, { DeferredPromise } from "p-defer";
import { Logger } from "../logger";

@singleton()
export class ObjectsStreamCompressor {
  private targetArchivePath: string;
  private archiveWriteStream: WriteStream;
  private compressorStream: stream.Transform;
  private _isDeflating: boolean;

  /**
   * Receive serialized objects and pipe them into compressor then to the target archive
   */
  private passStream: MiniPass;

  private writeStartedPromise: DeferredPromise<string>;

  constructor(@inject(Logger) private readonly logger: Logger) {
    this._isDeflating = false;
  }

  public deflateInit(targetArchivePath: string): Promise<string> {
    if (!targetArchivePath) {
      return Promise.reject("Missing target archive path");
    }

    this.resetStreams();
    this.targetArchivePath = targetArchivePath;
    this.writeStartedPromise = pDefer<string>();

    return this._deflateInit().then(() => {
      return Promise.resolve(this.targetArchivePath);
    });
  }

  private _deflateInit(): Promise<void> {
    if (!this.targetArchivePath) {
      throw new ElevateException("Missing target archive file");
    }

    this.logger.debug(`Writing objects to ${this.targetArchivePath} archive.`);
    this.archiveWriteStream = fs.createWriteStream(this.targetArchivePath);
    this.passStream = new MiniPass();
    this.compressorStream = new miniZlib.Gzip(); // Or new miniZlib.BrotliCompress();
    this.passStream.pipe(this.compressorStream).pipe(this.archiveWriteStream); // Redirect writes to archiveStream

    this._isDeflating = true;

    // Start json array
    return this._write("[");
  }

  /**
   * Write and compress an object into the archived compressed stream
   * @param object to compress and append to stream
   * @param isLastObject Tell if this is the last object on which stream will be ended
   * @return Promise of object properly written
   */
  public write(object: object, isLastObject: boolean): Promise<void> {
    if (!this.passStream) {
      return Promise.reject("Inflate not initialized. Please deflateInit() first");
    }

    const serializedObj = JSON.stringify(object);

    let writePromise: Promise<void>;

    // Is end of stream?
    if (isLastObject) {
      // Write last object and close json array
      writePromise = this._write(serializedObj).then(() => {
        return this._end("]");
      });
    } else {
      writePromise = this._write(`${serializedObj},`); // Append json object to stream
    }

    return writePromise.catch(err => {
      this._isDeflating = false;
      this.logger.error("Write error occurred in ObjectsStreamCompressor", err);
      return Promise.reject(err);
    });
  }

  /**
   * Trigger objects listening from the archived compressed stream
   * @param targetArchivePath archive file path
   * @return Observable emitting every object compressed from archive file.
   */
  public read(targetArchivePath: string): Subject<any> {
    const subject$ = new Subject<any>();

    // Decompress stream from source archive
    const decompressor = new miniZlib.Gunzip(); // Or new miniZlib.BrotliDecompress();

    const archiveFileStream = fs.createReadStream(targetArchivePath);
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

  /**
   * Trigger objects listening from the archived compressed stream
   * @param targetArchivePath archive file path
   * @param receiverHandler Receive current object just rode with errors on end reached. Client should resolve promise to read to next object, or reject to stop the reading
   * @return Observable emitting every object compressed from archive file.
   */
  public inflateInit(
    targetArchivePath: string,
    receiverHandler: (obj: object, index: number, err: Error, readEnded: boolean) => Promise<void>
  ): void {
    // Decompress stream from source archive
    const decompressor = new miniZlib.Gunzip();

    const archiveFileStream = fs.createReadStream(targetArchivePath);
    const decompressedJsonStream = archiveFileStream.pipe(decompressor).pipe(JSONStream.parse("*"));

    const closeStreams = () => {
      archiveFileStream.close();
      archiveFileStream.destroy();
      decompressedJsonStream.end();
      decompressedJsonStream.destroy();
    };

    let objectIndex = 0;

    decompressedJsonStream.on("data", obj => {
      archiveFileStream.pause();
      decompressedJsonStream.pause();

      receiverHandler(obj, objectIndex, null, false)
        .then(() => {
          // Client acknowledge the obj receive with a resolve
          // Resuming stream reading
          archiveFileStream.resume();
          decompressedJsonStream.resume();
        })
        .catch(clientErr => {
          // Client got an error on his side by with this rejection
          // Dont resume stream reading => close streams instead
          this.logger.error("Stop reading because of client error:", clientErr);
          closeStreams();
        });

      objectIndex++;
    });

    decompressedJsonStream.on("error", error => {
      receiverHandler(null, objectIndex, error, false).then(() => {
        closeStreams();
      });
    });

    decompressedJsonStream.on("end", () => {
      closeStreams();
      receiverHandler(null, objectIndex, null, true).then(() => {
        this.logger.debug(`Client acknowledged end of reading`);
      });
    });
  }

  private _write(data: any): Promise<void> {
    return new Promise(resolve => {
      this.passStream.write(data, null, resolve);
    });
  }

  private _end(data: any): Promise<void> {
    return new Promise<void>(resolve => {
      this.passStream.end(data, null, () => {
        setTimeout(() => {
          resolve();
          this._isDeflating = false;
        });
      });
    });
  }

  private resetStreams(): void {
    if (this.passStream) {
      this.passStream.destroy();
    }

    if (this.compressorStream) {
      this.compressorStream.destroy();
    }

    if (this.archiveWriteStream) {
      this.archiveWriteStream.close();
      this.archiveWriteStream.destroy();
    }

    this.passStream = null;
    this.compressorStream = null;
    this.archiveWriteStream = null;
  }

  get isDeflating(): boolean {
    return this._isDeflating;
  }
}
