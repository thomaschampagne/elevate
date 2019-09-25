import { TestBed } from "@angular/core/testing";

import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";
import { ConnectorSyncDateTimeDao } from "./connector-sync-date-time-dao.service";
import { ConnectorSyncDateTime } from "../../../../../modules/shared/models/sync/connector-sync-date-time.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector.enum";


describe("ConnectorSyncDateTimeDao", () => {

	let connectorSyncDateTimeDao: ConnectorSyncDateTimeDao = null;

	beforeEach((done: Function) => {

		// const lastSyncTime = Date.now();
		const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
			new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
			new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
		];

		const mockedDataStore: MockedDataStore<ConnectorSyncDateTime> = new MockedDataStore(connectorSyncDateTimes);

		TestBed.configureTestingModule({
			providers: [
				ConnectorSyncDateTimeDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		connectorSyncDateTimeDao = TestBed.get(ConnectorSyncDateTimeDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(connectorSyncDateTimeDao).toBeTruthy();
		done();
	});

});
