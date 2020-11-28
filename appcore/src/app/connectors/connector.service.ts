import { ConnectorType } from "@elevate/shared/sync";

export abstract class ConnectorService {
  public static printType(connectorType: ConnectorType): string {
    return connectorType.toLowerCase();
  }

  abstract sync(fastSync: boolean, forceSync: boolean): Promise<void>;
}
