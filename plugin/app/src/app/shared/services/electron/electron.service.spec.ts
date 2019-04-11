import { TestBed } from "@angular/core/testing";

import { ElectronService, ElectronWindow } from "./electron.service";
import * as Electron from "electron";
import { noop } from "rxjs";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import RendererInterface = Electron.RendererInterface;

describe("ElectronService", () => {

	let service: ElectronService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			],
			providers: [
				ElectronService
			]
		});

		// Retrieve injected preferencesService
		service = TestBed.get(ElectronService);

		done();
	});

	it("should provide electron instance if not existing", (done: Function) => {

		// Given
		service.instance = undefined;

		const electronWindow = (window as ElectronWindow);

		const electronRequire = (module: string) => {
			console.log("Loading module: " + module);
			return {} as RendererInterface;
		};

		electronWindow.require = electronRequire;

		const requireSpy = spyOn(electronWindow, "require").and.callFake(electronRequire);

		// When
		const electronInstance = service.electron;

		// Then
		expect(electronInstance).not.toBeNull();
		expect(requireSpy).toHaveBeenCalledWith("electron");

		done();
	});

	it("should provide electron instance when existing", (done: Function) => {

		// Given
		service.instance = {} as RendererInterface;

		const electronWindow = (window as ElectronWindow);

		const electronRequire = (module: string) => {
			console.log("Loading module: " + module);
			return {} as RendererInterface;
		};

		electronWindow.require = electronRequire;

		const requireSpy = spyOn(electronWindow, "require").and.callFake(electronRequire);

		// When
		const electronInstance = service.electron;

		// Then
		expect(electronInstance).not.toBeNull();
		expect(requireSpy).not.toHaveBeenCalled();

		done();
	});

	it("should exec command lines", (done: Function) => {

		// Given
		const expectedCommand = "cmd line";
		const expectedCallback = noop;
		const nodeModule = "child_process";

		const childProcessObject = {
			exec: (cmd: string, fn: Function) => {
				fn();
			}
		};

		const requireSpy = spyOn(service, "require").and.returnValue(childProcessObject);
		const execSpy = spyOn(childProcessObject, "exec");

		// When
		const result = service.exec(expectedCommand, expectedCallback);

		// Then
		expect(result).not.toBeNull();
		expect(requireSpy).toHaveBeenCalledWith(nodeModule);
		expect(execSpy).toHaveBeenCalledWith(expectedCommand, expectedCallback);

		done();
	});

	it("should read files in directory", (done: Function) => {

		// Given
		const path = "/path/to/folder";
		const folders = ["/path/to/folder/path01", "/path/to/folder/path02"];

		const nodeFsMethods = {
			readdirSync: () => {
				return folders;
			}
		};

		spyOn(service, "getNodeFsModule").and.returnValue(nodeFsMethods);
		const readDirSpy = spyOn(service.getNodeFsModule(), "readdirSync").and.returnValue(folders);

		// When
		const result = service.readDirSync(path);

		// Then
		expect(result).toEqual(folders);
		expect(readDirSpy).toHaveBeenCalledWith(path);

		done();
	});

	it("should read a file", (done: Function) => {

		// Given
		const file = "/path/to/folder/file";
		const content = "Hello world";

		const nodeFsMethods = {
			readFileSync: (file: string) => {
				return content;
			}
		};

		spyOn(service, "getNodeFsModule").and.returnValue(nodeFsMethods);
		const readFileSpy = spyOn(service.getNodeFsModule(), "readFileSync").and.returnValue(content);

		// When
		const result = service.readFileSync(file);

		// Then
		expect(result).toEqual(content);
		expect(readFileSpy).toHaveBeenCalledWith(file);

		done();
	});

	it("should check file existence", (done: Function) => {

		// Given
		const file = "/path/to/folder/file";
		const exists = true;

		const nodeFsMethods = {
			existsSync: (file: string) => {
				return true;
			}
		};

		spyOn(service, "getNodeFsModule").and.returnValue(nodeFsMethods);
		const existsSyncSpy = spyOn(service.getNodeFsModule(), "existsSync").and.returnValue(exists);

		// When
		const result = service.existsSync(file);

		// Then
		expect(result).toEqual(exists);
		expect(existsSyncSpy).toHaveBeenCalledWith(file);

		done();
	});

	it("should provide file stat", (done: Function) => {

		// Given
		const file = "/path/to/folder/file";
		const statSyncMethods = {
			isDirectory: () => {

			},
			isFile: () => {

			}
		};

		const nodeFsMethods = {
			statSync: statSyncMethods
		};

		spyOn(service, "getNodeFsModule").and.returnValue(nodeFsMethods);
		const statSyncSpy = spyOn(service.getNodeFsModule(), "statSync").and.returnValue(statSyncMethods);

		// When
		const result = service.statSync(file);

		// Then
		expect(result).toEqual(statSyncMethods);
		expect(statSyncSpy).toHaveBeenCalledWith(file);

		done();
	});

	it("should provide files from directory using file extension as string", (done: Function) => {

		// Given
		const data = [
			"/home/user/doc/file01.json",
			"/home/user/doc/file02.json",
			"/home/user/doc/file02.fake"
		];

		const expectedLayouts = [
			"/home/user/doc/file01.json",
			"/home/user/doc/file02.json"
		];

		const filterExt = ".json";
		const folderPath = "/home/user/doc/data";

		const nodeReadDirSyncSpy = spyOn(service, "readDirSync").and.returnValue(data);

		// When
		const result: string[] = service.filesIn(folderPath, filterExt);

		// Then
		expect(result.length).toEqual(expectedLayouts.length);
		expect(result).toEqual(expectedLayouts);
		expect(nodeReadDirSyncSpy).toHaveBeenCalled();

		done();
	});

	it("should provide files from directory using file extension as regex", (done: Function) => {

		// Given
		const images = [
			"/home/user/file.png",
			"/home/user/doc/file.JPG",
			"/home/user/doc/file.fake"
		];

		const expectedImage = [
			"/home/user/file.png",
			"/home/user/doc/file.JPG",
		];

		const filterRegex = /\.(gif|jpe?g|tiff|png)$/i;
		const folderPath = "/home/user/doc/data";

		const nodeReadDirSyncSpy = spyOn(service, "readDirSync").and.returnValue(images);

		// When
		const result: string[] = service.filesIn(folderPath, filterRegex);

		// Then
		expect(result.length).toEqual(expectedImage.length);
		expect(result).toEqual(expectedImage);
		expect(nodeReadDirSyncSpy).toHaveBeenCalledWith(folderPath);
		done();

	});

	it("should flag path as directory", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(true);
		const isDirectorySpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isDirectory: (): boolean => {
					return true;
				}
			};
		});

		// When
		const result = service.isDirectory(folderPath);

		// Then
		expect(result).toBeTruthy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isDirectorySpy).toHaveBeenCalled();

		done();
	});

	it("should flag path as not a directory", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(true);
		const isDirectorySpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isDirectory: (): boolean => {
					return false;
				}
			};
		});

		// When
		const result = service.isDirectory(folderPath);

		// Then
		expect(result).toBeFalsy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isDirectorySpy).toHaveBeenCalled();
		done();
	});

	it("should flag path as not a directory when path do not exists", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(false);
		const isDirectorySpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isDirectory: (): boolean => {
					return false;
				}
			};
		});

		// When
		const result = service.isDirectory(folderPath);

		// Then
		expect(result).toBeFalsy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isDirectorySpy).not.toHaveBeenCalled();
		done();
	});

	it("should flag path as not a directory (error)", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(true);
		const isDirectorySpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isDirectory: (): boolean => {
					throw new Error("Whoops!");
				}
			};
		});

		// When
		const result = service.isDirectory(folderPath);

		// Then
		expect(result).toBeFalsy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isDirectorySpy).toHaveBeenCalled();
		done();
	});

	it("should flag path as file", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data/file.json";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(true);
		const isFileSpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isFile: (): boolean => {
					return true;
				}
			};
		});

		// When
		const result = service.isFile(folderPath);

		// Then
		expect(result).toBeTruthy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isFileSpy).toHaveBeenCalled();

		done();
	});

	it("should flag path as not a file", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data/file.json";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(true);
		const isFileSpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isFile: (): boolean => {
					return false;
				}
			};
		});

		// When
		const result = service.isFile(folderPath);

		// Then
		expect(result).toBeFalsy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isFileSpy).toHaveBeenCalled();
		done();
	});

	it("should flag path as not a file when path do not exists", (done: Function) => {

		// Given
		const folderPath = "/home/user/doc/data/file.json";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(false);
		const isFileSpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isFile: (): boolean => {
					return false;
				}
			};
		});

		// When
		const result = service.isFile(folderPath);

		// Then
		expect(result).toBeFalsy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isFileSpy).not.toHaveBeenCalled();
		done();
	});

	it("should flag path as not a file (error)", (done: Function) => {

		// Given
		const filePath = "/home/user/doc/data/file.json";
		const existsSpy = spyOn(service, "existsSync").and.returnValue(true);
		const isFileSpy = spyOn(service, "statSync").and.callFake((path: string) => {
			return {
				isFile: (): boolean => {
					throw new Error("Whoops!");
				}
			};
		});

		// When
		const result = service.isFile(filePath);

		// Then
		expect(result).toBeFalsy();
		expect(existsSpy).toHaveBeenCalled();
		expect(isFileSpy).toHaveBeenCalled();
		done();
	});

	it("should identify windows platform", (done: Function) => {

		// Given
		const platform = "win32";
		service.instance = {
			remote: {
				process: {
					platform: platform
				}
			}
		} as RendererInterface;

		// When
		const result = service.isWindows();

		// Then
		expect(result).toBeTruthy();
		done();
	});

	it("should not identify windows platform", (done: Function) => {

		// Given
		const platform = "darwin";
		service.instance = {
			remote: {
				process: {
					platform: platform
				}
			}
		} as RendererInterface;

		// When
		const result = service.isWindows();

		// Then
		expect(result).toBeFalsy();
		done();
	});

	it("should provide electron remote", (done: Function) => {

		// Given
		service.instance = {remote: {}} as RendererInterface;

		// When
		const result = service.remote;

		// Then
		expect(result).not.toBeNull();
		done();
	});

	it("should provide electron require method", (done: Function) => {


		// Given
		const message = "Omg !";
		const myNodeModule = {
			hello: () => {
				return message;
			}
		};

		service.instance = {
			remote: {
				require(module: string): any {
					return myNodeModule;
				}
			}
		} as RendererInterface;

		const requireSpy = spyOn(service.remote, "require").and.callThrough();

		// When
		const result = service.require("myModule");

		// Then
		expect(result).not.toBeNull();
		expect(result).toEqual(myNodeModule);
		expect(result.hello()).toEqual(message);
		expect(requireSpy).toHaveBeenCalled();
		done();
	});

	it("should provide node fs module", (done: Function) => {

		// Given
		const nodeModule = "fs";
		const requireSpy = spyOn(service, "require").and.returnValue({});

		// When
		const result = service.getNodeFsModule();

		// Then
		expect(result).not.toBeNull();
		expect(requireSpy).toHaveBeenCalledWith(nodeModule);
		done();
	});


});
