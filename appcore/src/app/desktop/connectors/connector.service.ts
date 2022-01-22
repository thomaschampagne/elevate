export abstract class ConnectorService {
  abstract sync(fastSync: boolean, forceSync: boolean): Promise<void>;
}
