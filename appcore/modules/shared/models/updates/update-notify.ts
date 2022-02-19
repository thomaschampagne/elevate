export abstract class UpdateNotify {
  public abstract readonly isAutoUpdatable: boolean;

  protected constructor(
    public readonly version: string,
    public readonly date: Date,
    public readonly size: number,
    public readonly releaseNotes: string | null = null
  ) {}
}

export class StaticUpdateNotify extends UpdateNotify {
  public readonly isAutoUpdatable: boolean = false;
  public readonly downloadUrl: string;
  public readonly releaseUrl: string;

  constructor(
    version: string,
    date: Date,
    size: number,
    releaseNotes: string | null,
    downloadUrl: string,
    releaseUrl: string
  ) {
    super(version, date, size, releaseNotes);
    this.downloadUrl = downloadUrl;
    this.releaseUrl = releaseUrl;
  }
}

export class AutoUpdateNotify extends UpdateNotify {
  readonly isAutoUpdatable: boolean = true;

  constructor(version: string, date: Date, size: number, releaseNotes: string | null = null) {
    super(version, date, size, releaseNotes);
  }
}
