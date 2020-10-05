import { TestBed } from "@angular/core/testing";
import { ExtensionEventsService } from "./extension-events.service";
import { CoreMessages, SyncResultModel } from "@elevate/shared/models";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { LoggerService } from "../../logging/logger.service";
import { ConsoleLoggerService } from "../../logging/console-logger.service";

describe("ExtensionEventsService", () => {
    const pluginId = "c061d18abea0";
    let service: ExtensionEventsService;

    beforeEach(done => {
        spyOn(ExtensionEventsService, "getBrowserExternalMessages").and.returnValue({
            // @ts-ignore
            addListener: (message: any, sender: any, sendResponse: any) => {},
        });

        spyOn(ExtensionEventsService, "getBrowserPluginId").and.returnValue(pluginId);

        TestBed.configureTestingModule({
            providers: [
                ExtensionEventsService,
                { provide: DataStore, useClass: TestingDataStore },
                { provide: LoggerService, useClass: ConsoleLoggerService },
            ],
        });

        service = TestBed.inject(ExtensionEventsService);

        done();
    });

    it("should be created", done => {
        expect(service).toBeTruthy();
        expect(service.syncDone$).not.toBeNull();
        done();
    });

    it("should handle a sync done WITH changes from external messages", done => {
        // Given
        const expectedCallCount = 1;
        const spy = spyOn(service.syncDone$, "next");
        const expectedChangesFromSync = true;
        const message: any = {
            message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
            results: {
                activitiesChangesModel: {
                    added: [null, null],
                    edited: [null],
                    deleted: [],
                },
            } as SyncResultModel,
        };
        const senderId: string = pluginId;

        // When
        service.onBrowserRequestReceived(message, senderId);

        // Then
        expect(spy).toHaveBeenCalledTimes(expectedCallCount);
        expect(spy).toHaveBeenCalledWith(expectedChangesFromSync);

        done();
    });

    it("should not handle a sync done WITHOUT changes from external messages", done => {
        // Given
        const expectedCallCount = 1;
        const spy = spyOn(service.syncDone$, "next");
        const expectedChangesFromSync = false;
        const message: any = {
            message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
            results: {
                activitiesChangesModel: {
                    added: [],
                    edited: [],
                    deleted: [],
                },
            } as SyncResultModel,
        };
        const senderId: string = pluginId;

        // When
        service.onBrowserRequestReceived(message, senderId);

        // Then
        expect(spy).toHaveBeenCalledTimes(expectedCallCount);
        expect(spy).toHaveBeenCalledWith(expectedChangesFromSync);

        done();
    });

    it("should bypass handle external messages receive if sender is not the plugin it self", done => {
        // Given
        const spy = spyOn(service.syncDone$, "next");
        const message: any = {
            message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
            results: {},
        };
        const senderId = "fakeId";

        // When
        service.onBrowserRequestReceived(message, senderId);

        // Then
        expect(spy).not.toHaveBeenCalled();

        done();
    });
});
