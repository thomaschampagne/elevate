import { TestBed } from "@angular/core/testing";

import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";
import { ConnectorLastSyncDateTimeDao } from "./connector-last-sync-date-time.dao";
import { ConnectorLastSyncDateTime } from "../../../../../modules/shared/models/sync/connector-last-sync-date-time.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector.enum";


describe("ConnectorLastSyncDateTimeDao", () => {

	let connectorLastSyncDateTimeDao: ConnectorLastSyncDateTimeDao = null;

	beforeEach((done: Function) => {

		// const lastSyncTime = Date.now();
		const connectorLastSyncDateTimes: ConnectorLastSyncDateTime[] = [
			new ConnectorLastSyncDateTime(ConnectorType.STRAVA, 11111),
			new ConnectorLastSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
		];

		const mockedDataStore: MockedDataStore<ConnectorLastSyncDateTime> = new MockedDataStore(connectorLastSyncDateTimes);

		TestBed.configureTestingModule({
			providers: [
				ConnectorLastSyncDateTimeDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		connectorLastSyncDateTimeDao = TestBed.get(ConnectorLastSyncDateTimeDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(connectorLastSyncDateTimeDao).toBeTruthy();
		done();
	});

});
