import { ConnectorInfo } from "./connector-info.model";

export class IntervalsIcuConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: IntervalsIcuConnectorInfo = new IntervalsIcuConnectorInfo(null, null);

  /**
   * @param athleteId intervals.icu athlete id (e.g. "i12345"). "0" targets the athlete owning the api key.
   * @param apiKey Personal api key available from intervals.icu settings page ("Developer Settings" section)
   * @param updateExistingNamesTypesCommutes Override existing activities names, types and commutes with intervals.icu ones
   */
  constructor(
    public athleteId: string | null,
    public apiKey: string | null,
    public updateExistingNamesTypesCommutes: boolean = true
  ) {
    super();
    this.athleteId = athleteId;
    this.apiKey = apiKey;
    this.updateExistingNamesTypesCommutes = updateExistingNamesTypesCommutes;
  }
}
