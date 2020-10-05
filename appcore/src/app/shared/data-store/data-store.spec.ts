import { TestBed } from "@angular/core/testing";
import { CollectionDef } from "./collection-def";
import { DataStore } from "./data-store";
import { ConsoleLoggerService } from "../services/logging/console-logger.service";
import { TestingDataStore } from "./testing-datastore.service";
import { LoggerService } from "../services/logging/logger.service";

class FakeDoc {
    id: string;
    name: string;
    subject?: string;
}

describe("DataStore", () => {

    const collectionDef = new CollectionDef<FakeDoc>("fakeDocs", {unique: ["id"]});
    let dataStore: TestingDataStore<FakeDoc>;
    let collection: Collection<FakeDoc>;

    beforeEach(done => {

        TestBed.configureTestingModule({
            providers: [
                TestingDataStore,
                {provide: DataStore, useClass: TestingDataStore},
                {provide: LoggerService, useClass: ConsoleLoggerService}
            ]
        });

        dataStore = TestBed.inject(TestingDataStore) as TestingDataStore<any>;
        collection = dataStore.db.addCollection(collectionDef.name);
        collection.uniqueNames = ["id"];
        done();
    });

    it("should insert an document", done => {

        // Given
        const fakeDoc: FakeDoc = {id: "01", name: "My first document"};

        // When
        const promise = dataStore.insert(collectionDef, fakeDoc, true);

        // Then
        promise.then(inserted => {
            expect(inserted).not.toBeNull();
            expect(inserted.name).toEqual(fakeDoc.name);
            done();
        });
    });

    it("should insert many documents", done => {

        // Given
        const fakeDocs: FakeDoc[] = [{id: "01", name: "My first document"}, {id: "02", name: "My 2nd document"}];

        // When
        const promise = dataStore.insertMany(collectionDef, fakeDocs, true);

        // Then
        promise.then(() => {
            return dataStore.count(collectionDef);
        }).then(count => {
            expect(count).toEqual(2);
            done();
        });
    });

    it("should update an document", done => {

        // Given
        const expectedName = "Updated document name";
        const fakeDoc: FakeDoc = {id: "01", name: "My document"};
        const insertedDocument = collection.insert(fakeDoc);
        insertedDocument.name = expectedName;

        // When
        const promise = dataStore.update(collectionDef, insertedDocument, true);

        // Then
        promise.then(updated => {
            expect(updated).not.toBeNull();
            expect(updated.name).toEqual(expectedName);
            done();
        });
    });

    it("should update many documents", done => {

        // Given
        const expectedName01 = "Updated name 01";
        const expectedName02 = "Updated name 02";
        const fakeDocs: FakeDoc[] = [{id: "01", name: "My first document"}, {id: "02", name: "My 2nd document"}];
        const insertedDocuments = collection.insert(fakeDocs);
        insertedDocuments[0].name = expectedName01;
        insertedDocuments[1].name = expectedName02;

        // When
        const promise = dataStore.updateMany(collectionDef, insertedDocuments, true);

        // Then
        promise.then(() => {
            return dataStore.find(collectionDef, []);
        }).then(results => {
            expect(results.length).toEqual(2);
            expect(results[0].name).toEqual(expectedName01);
            expect(results[1].name).toEqual(expectedName02);
            done();
        });
    });

    it("should put not existing document", done => {

        // Given
        const fakeDoc: FakeDoc = {id: "01", name: "My first document"};

        // When
        const promise = dataStore.put(collectionDef, fakeDoc, true);

        // Then
        promise.then(upserted => {
            expect(upserted).not.toBeNull();
            expect(upserted.name).toEqual(fakeDoc.name);
            done();
        });
    });

    it("should put existing document", done => {

        // Given
        const expectedName = "My document";
        const expectedType = "None";
        const fakeDoc: FakeDoc = {id: "01", name: expectedName};
        const insertedDocument: FakeDoc = collection.insert(fakeDoc);
        insertedDocument.subject = expectedType;

        // When
        const promise = dataStore.put(collectionDef, insertedDocument, true);

        // Then
        promise.then(upserted => {
            expect(upserted).not.toBeNull();
            expect(upserted.name).toEqual(expectedName);
            expect(upserted.subject).toEqual(expectedType);
            done();
        });
    });

    it("should find and count document results", done => {

        // Given
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);

        // When
        const promise = dataStore.find(collectionDef, []);

        // Then
        promise.then(results => {
            expect(results).not.toEqual([]);
            expect(results.length).toEqual(2);
            return dataStore.count(collectionDef);
        }).then(count => {
            expect(count).toEqual(2);
            done();
        });
    });

    it("should find and sort document ascending", done => {

        // Given
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc03: FakeDoc = {id: "03", name: "My 3nd document"};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);
        collection.insert(fakeDoc03);

        const sort: { propName: keyof FakeDoc, options: Partial<SimplesortOptions> } = {
            propName: "name",
            options: {
                desc: false
            }
        };
        // When
        const promise = dataStore.find(collectionDef, [], null, sort);

        // Then
        promise.then(results => {
            expect(results).not.toEqual([]);
            expect(results.length).toEqual(3);
            expect(results[0].name).toEqual("My 1st document");
            expect(results[2].name).toEqual("My 3nd document");
            done();
        });
    });

    it("should find and sort document descending", done => {

        // Given
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc03: FakeDoc = {id: "03", name: "My 3nd document"};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);
        collection.insert(fakeDoc03);

        const sort: { propName: keyof FakeDoc, options: Partial<SimplesortOptions> } = {
            propName: "name",
            options: {
                desc: true
            }
        };

        // When
        const promise = dataStore.find(collectionDef, [], null, sort);

        // Then
        promise.then(results => {
            expect(results).not.toEqual([]);
            expect(results.length).toEqual(3);
            expect(results[0].name).toEqual("My 3nd document");
            expect(results[2].name).toEqual("My 1st document");
            done();
        });
    });

    it("should find one document", done => {

        // Given
        const expectedName = "My 2nd document";
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc02: FakeDoc = {id: "02", name: expectedName};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);

        // When
        const promise = dataStore.findOne(collectionDef, null, {name: expectedName});

        // Then
        promise.then(document => {
            expect(document.name).toEqual(expectedName);
            done();
        });
    });

    it("should get by specific unique id", done => {

        // Given
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        const fakeDoc03: FakeDoc = {id: "03", name: "My 3st document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);
        collection.insert(fakeDoc03);

        // When
        const promise = dataStore.getById(collectionDef, fakeDoc02.id);

        // Then
        promise.then(document => {
            expect(document.name).toEqual(fakeDoc02.name);
            done();
        });
    });

    it("should get by default unique id", done => {

        // Given
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        const fakeDoc03: FakeDoc = {id: "03", name: "My 3st document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);
        collection.insert(fakeDoc03);

        collection.uniqueNames = []; // Force default $loki index

        // When
        const promise = dataStore.getById(collectionDef, 3);

        // Then
        promise.then(document => {
            expect(document.name).toEqual(fakeDoc03.name);
            done();
        });
    });

    it("should remove a document", done => {

        // Given
        const expectedName = "My 1st document";
        const fakeDoc01: FakeDoc = {id: "01", name: expectedName};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);

        // When
        const promise = dataStore.remove(collectionDef, fakeDoc02, true);

        // Then
        promise.then(() => {
            return dataStore.find(collectionDef, []);
        }).then(results => {
            expect(results.length).toEqual(1);
            expect(results[0].name).toEqual(expectedName);
            done();
        });
    });

    it("should remove a document by specific id", done => {

        // Given
        const expectedName = "My 1st document";
        const fakeDoc01: FakeDoc = {id: "01", name: expectedName};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);

        // When
        const promise = dataStore.removeById(collectionDef, fakeDoc02.id, true);

        // Then
        promise.then(() => {
            return dataStore.find(collectionDef, []);
        }).then(results => {
            expect(results.length).toEqual(1);
            expect(results[0].name).toEqual(expectedName);
            done();
        });
    });

    it("should remove a document by many specifics ids", done => {

        // Given
        const expectedName = "My 2nd document";
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc02: FakeDoc = {id: "02", name: expectedName};
        const fakeDoc03: FakeDoc = {id: "03", name: "My 3rd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);
        collection.insert(fakeDoc03);

        // When
        const promise = dataStore.removeByManyIds(collectionDef, [fakeDoc01.id, fakeDoc03.id], true);

        // Then
        promise.then(() => {
            return dataStore.find(collectionDef, []);
        }).then(results => {
            expect(results.length).toEqual(1);
            expect(results[0].name).toEqual(expectedName);
            done();
        });
    });

    it("should clear docs", done => {

        // Given
        const fakeDoc01: FakeDoc = {id: "01", name: "My 1st document"};
        const fakeDoc02: FakeDoc = {id: "02", name: "My 2nd document"};
        collection.insert(fakeDoc01);
        collection.insert(fakeDoc02);

        // When
        const promise = dataStore.clear(collectionDef, true);

        // Then
        promise.then(() => {
            return dataStore.count(collectionDef);
        }).then(count => {
            expect(count).toEqual(0);
            done();
        });
    });
});
