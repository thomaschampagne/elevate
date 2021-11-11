export class UserLactateThreshold {
  public static readonly DEFAULT_MODEL: UserLactateThreshold = {
    default: null,
    cycling: null,
    running: null
  };

  public default: number;
  public cycling: number;
  public running: number;
}
