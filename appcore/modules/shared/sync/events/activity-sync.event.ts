import { SyncEventType } from "./sync-event-type";
import { SyncEvent } from "./sync.event";
import { ConnectorType } from "../connectors/connector-type.enum";
import { Activity } from "../../models/sync/activity.model";

export class ActivitySyncEvent extends SyncEvent {
  public activity: Activity;
  public deflatedStreams: string;
  public isNew: boolean;

  constructor(
    fromConnectorType: ConnectorType,
    description: string,
    activity: Activity,
    isNew: boolean,
    deflatedStreams: string = null
  ) {
    super(SyncEventType.ACTIVITY, fromConnectorType, description);
    this.activity = activity;
    this.deflatedStreams = deflatedStreams ? deflatedStreams : null;
    this.isNew = isNew;
  }
}
