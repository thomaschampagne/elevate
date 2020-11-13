import { ElevateSport } from "../../enums";

export class ActivitiesChangesModel {
  public added: number[];
  public deleted: number[];
  public edited: Array<{ id: number; name: string; type: ElevateSport }>;
}
