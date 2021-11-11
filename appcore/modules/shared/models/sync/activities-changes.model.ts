import { ElevateSport } from "../../enums/elevate-sport.enum";

export class ActivitiesChangesModel {
  public added: number[];
  public deleted: number[];
  public edited: Array<{ id: number; name: string; type: ElevateSport }>;
}
