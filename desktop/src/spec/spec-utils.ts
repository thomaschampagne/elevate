import _ from "lodash";
import { Time } from "@elevate/shared/tools";

export class SpecUtils {
  // Must be committed as "false"
  public static DEBUG_ENABLED = false;

  // Must be committed as "true"
  public static THROW_ON_ERROR = true;

  private static FAILED_ASSERTS: Error[] = [];

  public static assertNearEqual(
    actual: number,
    expected: number,
    decimals: number = 0,
    tolerancePercentage: number = 1
  ): void {
    const actualRounded = _.round(actual, decimals);
    const expectedRounded = _.round(expected, decimals);

    if (!Number.isFinite(actualRounded)) {
      const message = `Actual is not a number. Can't compare with expected value of "${expectedRounded}"`;
      if (SpecUtils.THROW_ON_ERROR) {
        throw new Error(message);
      } else {
        console.error(message);
      }
      SpecUtils.FAILED_ASSERTS.push(new Error(message));
      return;
    }

    if (actualRounded !== expectedRounded) {
      if (tolerancePercentage === 0) {
        throw new Error(`Actual "${actualRounded}" don't comply with expected "${expectedRounded}"`);
      } else {
        const tolerance = (expected * tolerancePercentage) / 100;
        const minExpected = _.round(expected - tolerance, decimals);
        const maxExpected = _.round(expected + tolerance, decimals);

        if (actualRounded < minExpected) {
          const message = `Actual "${actualRounded}" BELOW MIN expected value: "${minExpected}" for an expected value of "${expectedRounded}"`;
          if (SpecUtils.THROW_ON_ERROR) {
            throw new Error(message);
          } else {
            console.error(message);
          }
          SpecUtils.FAILED_ASSERTS.push(new Error(message));
          return;
        }

        if (actualRounded > maxExpected) {
          const message = `Actual "${actualRounded}" ABOVE MAX expected value: "${maxExpected}" for an expected value of "${expectedRounded}"`;
          if (SpecUtils.THROW_ON_ERROR) {
            throw new Error(message);
          } else {
            console.error(message);
          }
          SpecUtils.FAILED_ASSERTS.push(new Error(message));
          return;
        }

        if (SpecUtils.DEBUG_ENABLED) {
          console.log(
            `[PASS] Actual "${actualRounded}" complies expected "${expectedRounded}" with "${minExpected} < ${actualRounded} < ${maxExpected}" and tolerance "${tolerance}"`
          );
        }
      }
    } else {
      if (SpecUtils.DEBUG_ENABLED) {
        console.log(`[PASS] Actual "${actual}" complies expected "${expected}"`);
      }
    }
  }

  public static assertNearEqualTime(
    actualTime: number | string,
    expectedTime: number | string,
    tolerancePercentage: number = 1
  ): void {
    const expectedSeconds = typeof expectedTime === "string" ? Time.militaryToSec(expectedTime) : expectedTime;
    const actualSeconds = typeof actualTime === "string" ? Time.militaryToSec(actualTime) : actualTime;

    const deltaTolerance = (expectedSeconds * tolerancePercentage) / 100;

    const lowerTolerance = expectedSeconds - deltaTolerance;
    if (actualSeconds < lowerTolerance) {
      const message = `Actual time of "${Time.secToMilitary(
        actualSeconds
      )}" (or ${actualSeconds}s) IS LOWER THAN "${Time.secToMilitary(
        expectedSeconds
      )}" Min possible value: "${Time.secToMilitary(
        lowerTolerance
      )}" (or ${lowerTolerance}s); Delta seconds: ${deltaTolerance}`;

      if (SpecUtils.THROW_ON_ERROR) {
        throw new Error(message);
      } else {
        console.error(message);
      }
      SpecUtils.FAILED_ASSERTS.push(new Error(message));
    }

    const highTolerance = expectedSeconds + deltaTolerance;
    if (actualSeconds > highTolerance) {
      const message = `Actual time of "${Time.secToMilitary(
        actualSeconds
      )}" (or ${actualSeconds}s) IS HIGHER THAN "${Time.secToMilitary(
        expectedSeconds
      )}". Max possible value: "${Time.secToMilitary(
        highTolerance
      )}" (or ${highTolerance}s); Delta seconds: ${deltaTolerance}`;

      if (SpecUtils.THROW_ON_ERROR) {
        throw new Error(message);
      } else {
        console.error(message);
      }
      SpecUtils.FAILED_ASSERTS.push(new Error(message));
    }

    if (SpecUtils.DEBUG_ENABLED) {
      console.log(
        `[PASS] Actual time matches expected time tolerance (${tolerancePercentage}%) : "${Time.secToMilitary(
          lowerTolerance
        )}" < "${Time.secToMilitary(actualSeconds)}" < "${Time.secToMilitary(
          highTolerance
        )}". Expected was "${Time.secToMilitary(expectedSeconds)}"`
      );
    }
  }

  public static startTrackAssertFailed(): void {
    SpecUtils.FAILED_ASSERTS = [];
  }

  public static endTrackAssertFailed(): void {
    if (SpecUtils.DEBUG_ENABLED) {
      console.error(`FAILED_ASSERTS count: ${SpecUtils.FAILED_ASSERTS.length}`);
    }
    SpecUtils.FAILED_ASSERTS = [];
  }
}
