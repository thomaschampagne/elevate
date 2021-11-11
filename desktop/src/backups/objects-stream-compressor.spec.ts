import { container } from "tsyringe";
import { ObjectsStreamCompressor } from "./objects-stream-compressor";
import path from "path";
import fs from "fs";
import { sleep } from "@elevate/shared/tools/sleep";

describe("ObjectsStreamCompressor", () => {
  const expectedTargetArchivePath = path.join(__dirname, "archive.elv");

  let objectsStreamCompressor: ObjectsStreamCompressor;

  beforeEach(done => {
    objectsStreamCompressor = container.resolve(ObjectsStreamCompressor);
    done();
  });

  afterEach(done => {
    if (fs.existsSync(expectedTargetArchivePath)) {
      fs.unlinkSync(expectedTargetArchivePath);
    }
    done();
  });

  it("should compress and read objects from", done => {
    // Given
    const fakeObjects: any[] = [{ foo1: "bar1" }, { foo2: "bar2" }, { foo3: "bar3" }];

    // ... writing objects
    const compressedStreamPromise = objectsStreamCompressor
      .deflateInit(expectedTargetArchivePath)
      .then(targetArchivePath => {
        expect(targetArchivePath).toEqual(expectedTargetArchivePath);

        return fakeObjects.reduce((previousPromise: Promise<void>, obj: {}, index: number) => {
          return previousPromise.then(() => {
            return objectsStreamCompressor.write(obj, index === fakeObjects.length - 1);
          });
        }, Promise.resolve());
      });

    // When
    compressedStreamPromise.then(() => {
      const objects$ = objectsStreamCompressor.read(expectedTargetArchivePath);

      const receivedObjects = [];
      objects$.subscribe(
        object => receivedObjects.push(object),
        error => {
          throw new Error("Whoops: " + error.message);
        },
        () => {
          // Then
          expect(receivedObjects).toEqual(fakeObjects);
          done();
        }
      );
    });
  });

  it("should compress and control objects rode from stream through an handler", done => {
    // Given
    const fakeObjects: any[] = [
      { foo1: "bar1" },
      { foo2: "bar2" },
      { foo3: "bar3" },
      { foo4: "bar4" },
      { foo5: "bar5" }
    ];

    // ... writing objects
    const compressedStreamPromise = objectsStreamCompressor.deflateInit(expectedTargetArchivePath).then(() => {
      return fakeObjects.reduce((previousPromise: Promise<void>, obj: {}, index: number) => {
        return previousPromise.then(() => {
          return objectsStreamCompressor.write(obj, index === fakeObjects.length - 1);
        });
      }, Promise.resolve());
    });

    // When
    compressedStreamPromise
      .then(() => {
        const receivedObjects = [];

        return objectsStreamCompressor.inflateInit(
          expectedTargetArchivePath,
          (obj: object, index: number, err: Error, ended: boolean): Promise<void> => {
            // No errors are expected
            expect(err).toBeNull();

            if (ended) {
              // Then
              expect(receivedObjects.length).toEqual(fakeObjects.length);
              done();
            } else {
              receivedObjects.push(obj);
            }

            return sleep(10);
          }
        );
      })
      .then(() => {
        console.log("Deflate started");
      });
  });
});
