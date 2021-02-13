import { container } from "tsyringe";
import { ObjectsStreamCompressor } from "./objects-stream-compressor";
import path from "path";
import fs from "fs";

describe("ObjectsStreamCompressor", () => {
  const targetArchivePath = path.join(__dirname, "archive.elv");

  let objectsStreamCompressor: ObjectsStreamCompressor;

  beforeEach(done => {
    objectsStreamCompressor = container.resolve(ObjectsStreamCompressor);
    done();
  });

  afterEach(done => {
    if (fs.existsSync(targetArchivePath)) {
      fs.unlinkSync(targetArchivePath);
    }
    done();
  });

  it("should compress and read objects from", done => {
    // Given
    const fakeObjects: any[] = [{ foo1: "bar1" }, { foo2: "bar2" }, { foo3: "bar3" }];

    objectsStreamCompressor.targetArchivePath = targetArchivePath;

    // When writing objects
    const promiseObjectsWritten = fakeObjects.reduce((previousPromise: Promise<void>, obj: {}, index: number) => {
      return previousPromise.then(() => {
        return objectsStreamCompressor.write(obj, index === fakeObjects.length - 1);
      });
    }, Promise.resolve());

    // Then
    promiseObjectsWritten.then(() => {
      expect(fs.existsSync(targetArchivePath)).toBeTruthy();

      const objects$ = objectsStreamCompressor.read();

      const receivedObjects = [];
      objects$.subscribe(
        object => receivedObjects.push(object),
        error => {
          throw new Error("Whoops: " + error.message);
        },
        () => {
          console.log(receivedObjects);
          console.log(fakeObjects);
          expect(receivedObjects.length).toEqual(fakeObjects.length);
          expect(receivedObjects[1]).toEqual(fakeObjects[1]);
          done();
        }
      );
    });
  });
});
