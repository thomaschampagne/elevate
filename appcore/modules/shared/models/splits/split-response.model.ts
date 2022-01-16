import { SplitRequestType } from "./split-request-type.enum";

export class SplitResponse {
  public type: SplitRequestType;
  public range: number;
  public results: { streamKey: string; value: number; indexes: number[] }[];
}
