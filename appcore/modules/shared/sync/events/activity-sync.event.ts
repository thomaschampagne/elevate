import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";
import { SyncedActivityModel } from "../../models";

export class ActivitySyncEvent extends SyncEvent {
  public activity: SyncedActivityModel;
  public deflatedStreams: string;
  public isNew: boolean;

  constructor(
    fromConnectorType: ConnectorType,
    description: string,
    activity: SyncedActivityModel,
    isNew: boolean,
    deflatedStreams: string = null
  ) {
    super(SyncEventType.ACTIVITY, fromConnectorType, description);
    this.activity = activity;
    this.deflatedStreams = deflatedStreams ? deflatedStreams : null;
    this.isNew = isNew;
  }
}
