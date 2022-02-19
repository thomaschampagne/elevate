import { UserLactateThreshold } from "./user-lactate-threshold.model";

export class AthleteSettings {
  public static readonly DEFAULT_MAX_HR: number = 190;
  public static readonly DEFAULT_REST_HR: number = 65;
  public static readonly DEFAULT_WEIGHT: number = 70;
  public static readonly DEFAULT_CYCLING_FTP: number = null;
  public static readonly DEFAULT_RUNNING_FTP: number = null;
  public static readonly DEFAULT_SWIM_FTP: number = null;

  public static readonly DEFAULT_MODEL: AthleteSettings = new AthleteSettings(
    AthleteSettings.DEFAULT_MAX_HR,
    AthleteSettings.DEFAULT_REST_HR,
    UserLactateThreshold.DEFAULT_MODEL,
    AthleteSettings.DEFAULT_CYCLING_FTP,
    AthleteSettings.DEFAULT_RUNNING_FTP,
    AthleteSettings.DEFAULT_SWIM_FTP,
    AthleteSettings.DEFAULT_WEIGHT
  );

  constructor(
    public maxHr: number,
    public restHr: number,
    public lthr: UserLactateThreshold,
    public cyclingFtp: number,
    public runningFtp: number,
    public swimFtp: number,
    public weight: number
  ) {}
}
