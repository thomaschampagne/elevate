import { container } from "tsyringe";
import { HttpClient } from "./http.client";

describe("HttpClient", () => {
  let httpClient: HttpClient;

  beforeEach(done => {
    httpClient = container.resolve(HttpClient);
    done();
  });

  it("should success on second retry", done => {
    // Given
    const url = "http://fake.url/";
    const allowedRetries = 5;
    const expectedTotalTries = 3;
    const timeoutError = {
      errno: "ETIMEDOUT",
      code: "ETIMEDOUT",
      syscall: "connect",
      address: "6.6.6.6",
      port: 80
    };

    let nativeGetCount = 0;
    const nativeGetSpy = spyOn(httpClient, "get").and.callFake(() => {
      nativeGetCount++;

      if (nativeGetCount === expectedTotalTries) {
        return Promise.resolve();
      }

      return Promise.reject(timeoutError);
    });

    // When
    const promise = httpClient.getRetryTimeout(url, {}, allowedRetries, 10, 10);

    // Then
    promise.then(
      () => {
        expect(nativeGetSpy).toHaveBeenCalledTimes(expectedTotalTries);
        done();
      },
      () => {
        throw new Error("Whoops! I should not be here!");
      }
    );
  });

  it("should failed after 3 retries", done => {
    // Given
    const url = "http://fake.url/";
    const allowedRetries = 3;
    const expectedTotalTries = 4;
    const timeoutError = {
      errno: "ETIMEDOUT",
      code: "ETIMEDOUT",
      syscall: "connect",
      address: "6.6.6.6",
      port: 80
    };

    const nativeGetSpy = spyOn(httpClient, "get").and.returnValue(Promise.reject(timeoutError));

    // When
    const promise = httpClient.getRetryTimeout(url, {}, allowedRetries, 10, 10);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
      },
      () => {
        expect(nativeGetSpy).toHaveBeenCalledTimes(expectedTotalTries);
        done();
      }
    );
  });
});
