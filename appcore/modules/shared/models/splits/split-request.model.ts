import { SplitRequestType } from "./split-request-type.enum";
import { ElevateSport } from "../../enums/elevate-sport.enum";

export class SplitRequest {
  public type: SplitRequestType;
  public sport: ElevateSport;
  public range: number;
  public scaleStream: number[];
  public dataStreams: { streamKey: string; stream: number[] }[];
}
