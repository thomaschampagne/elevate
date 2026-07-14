import path from "path";
import { app } from "electron";
import { inject, singleton } from "tsyringe";
import { GarminCliRunner } from "./garmin-cli-runner";

export interface GarminActivitySummary {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  activityType: string;
  path: string; // already-downloaded .fit file path, written by garmin_sync.py
}

@singleton()
export class GarminApiClient {
  private static readonly BATCH_SIZE = 20;

  constructor(@inject(GarminCliRunner) private readonly cli: GarminCliRunner) {}

  private get tokenstoreDir(): string {
    return path.join(app.getPath("userData"), "garmin-session");
  }

  /**
   * Fetches + downloads activities in bounded batches, one `uv run` process
   * per batch.
   * Yields already-downloaded GarminActivitySummary entries (with .path set)
   * as each batch completes.
   */
  public async *iterateActivities(afterDate: Date | null, outDir: string): AsyncGenerator<GarminActivitySummary> {
    let start = 0;

    while (true) {
      const args = [
        "--tokenstore",
        this.tokenstoreDir,
        "--no-interactive",
        "--outdir",
        outDir,
        "--start",
        String(start),
        "--limit",
        String(GarminApiClient.BATCH_SIZE)
      ];

      if (afterDate) {
        args.push("--after", afterDate.toISOString());
      }

      const result = await this.cli.run(args);

      for (const file of result.files as GarminActivitySummary[]) {
        yield file;
      }

      if (result.exhausted || !result.files || result.files.length === 0) {
        return;
      }

      start = result.nextStart;
    }
  }
}
