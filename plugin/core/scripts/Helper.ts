import * as Q from "q";
import { IStorageUsage } from "./StorageManager";
import { MessagesModel } from "../../shared/models/messages.model";
import { SpeedUnitDataModel } from "../../shared/models/activity-data/speed-unit-data.model";
import { Constant } from "../../shared/Constant";

export class Helper {

	/**
	 *
	 * @param {string} measurementPreference meters or imperial
	 * @returns {SpeedUnitDataModel}
	 */
	public static getSpeedUnitData(measurementPreference: string): SpeedUnitDataModel {
		const units: string = (measurementPreference == "meters") ? "km" : "mi";
		const speedUnitPerHour: string = (measurementPreference == "meters") ? "km/h" : "mi/h";
		const speedUnitFactor: number = (speedUnitPerHour == "km/h") ? 1 : Constant.KM_TO_MILE_FACTOR;

		const speedUnitData: SpeedUnitDataModel = {
			speedUnitPerHour,
			speedUnitFactor,
			units,
		};
		return speedUnitData;
	}

	public static HHMMSStoSeconds(str: string): number {

		let p: string[] = str.split(":"),
			s: any = 0,
			m = 1;

		while (p.length > 0) {
			s += m * parseInt(p.pop(), 10);
			m *= 60;
		}
		return s;
	}

	public static secondsToHHMMSS(secondsParam: number, trimLeadingZeros?: boolean): string {

		const secNum: number = Math.round(secondsParam); // don't forget the second param
		const hours: number = Math.floor(secNum / 3600);
		const minutes: number = Math.floor((secNum - (hours * 3600)) / 60);
		const seconds: number = secNum - (hours * 3600) - (minutes * 60);

		let time: string = ((hours < 10) ? "0" + hours.toFixed(0) : hours.toFixed(0));
		time += ":" + ((minutes < 10) ? "0" + minutes.toFixed(0) : minutes.toFixed(0));
		time += ":" + ((seconds < 10) ? "0" + seconds.toFixed(0) : seconds.toFixed(0));

		return (trimLeadingZeros ? Helper.trimLeadingZerosHHMMSS(time) : time);
	}

	public static trimLeadingZerosHHMMSS(time: string): string {
		const result: string = time.replace(/^(0*:)*/, "").replace(/^0*/, "") || "0";
		if (result.indexOf(":") < 0) {
			return result + "s";
		}
		return result;
	}

	public static weightedPercentiles(values: number[], weights: number[], percentiles: number[]): number[] {
		// inspired from https://en.wikipedia.org/wiki/Weighted_median and https://en.wikipedia.org/wiki/Percentile#Definition_of_the_Weighted_Percentile_method
		const list: any[] = [];
		let tot = 0;
		for (let i = 0; i < values.length; i++) {
			list.push({value: values[i], weight: weights[i]});
			tot += weights[i];
		}
		list.sort((a, b) => {
			return a.value - b.value;
		});
		const result: number[] = [];
		for (let i = 0; i < percentiles.length; i++) {
			result.push(0);
		}

		let cur = 0;
		for (let i = 0; i < list.length; i++) {
			for (let j = 0; j < percentiles.length; j++) {
				// found the sample matching the percentile
				if (cur < percentiles[j] * tot && (cur + list[i].weight) > (percentiles[j] - 0.00001) * tot) {
					result[j] = list[i].value;
				}
			}
			cur += list[i].weight;
		}

		return result;
	}

	public static heartrateFromHeartRateReserve(hrr: number, maxHr: number, restHr: number): number {
		return Math.abs(Math.floor(hrr / 100 * (maxHr - restHr) + restHr));
	}

	public static heartRateReserveFromHeartrate(hr: number, maxHr: number, restHr: number): number {
		return (hr - restHr) / (maxHr - restHr);
	}

	/**
	 * Sending message to store key:value into storageType via background page
	 */
	public static setToStorage(extensionId: string, storageType: string, key: string, value: any, callback?: Function): Q.Promise<any> {
		return this.sendMessage(
			extensionId,
			{method:MessagesModel.ON_SET_FROM_STORAGE,params:{ storage: storageType, key, value }},
			callback
		);
	}

	/**
	 * Sending message to get key:value into storageType via background page
	 * @param extensionId
	 * @param storageType StorageManager.TYPE_LOCAL || StorageManager.TYPE_SYNC
	 * @param key
	 * @param callback
	 * @return {Q.Promise<any>}
	 */
	public static getFromStorage(extensionId: string, storageType: string, key: string, callback?: Function): Q.Promise<any> {
		return this.sendMessage(
			extensionId,
			{ method: MessagesModel.ON_GET_FROM_STORAGE, params: { storage: storageType,	key}},
			callback
		);
	}

	public static removeFromStorage(extensionId: string, storageType: string, key: string, callback?: Function): Q.Promise<any> {
		return this.sendMessage(
			extensionId,
			{method: MessagesModel.ON_REMOVE_FROM_STORAGE, params: {storage: storageType,key}},
			callback
		);
	}

	public static reloadBrowserTab(extensionId: string, sourceTabId: number) {
		return this.sendMessage(
			extensionId,
			{method: MessagesModel.ON_RELOAD_BROWSER_TAB,params: {sourceTabId}}
		);
	}

	public static getStorageUsage(extensionId: string, storageType: string, callback?: Function): Q.IPromise<IStorageUsage> {
		return this.sendMessage(
			extensionId,
			{method: MessagesModel.ON_STORAGE_USAGE, params: { storage: storageType}},
			callback
		);
	}

	public static formatNumber(n: any, c?: any, d?: any, t?: any): string {

		c = isNaN(c = Math.abs(c)) ? 2 : c,
			d = d == undefined ? "." : d,
			t = t == undefined ? "," : t;

		const s: any = n < 0 ? "-" : "";

		const i: any = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "";

		let j: any;
		j = (j = i.length) > 3 ? j % 3 : 0;

		return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
	}

	public static secondsToDHM(sec_num: number, trimZeros?: boolean): string {
		const days: number = Math.floor(sec_num / 86400);
		const hours: number = Math.floor((sec_num - (days * 86400)) / 3600);
		const minutes: number = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
		if (trimZeros && days === 0) {
			if (hours === 0) {
				return minutes + "m";
			}
			return hours + "h " + minutes + "m";
		}
		return days + "d " + hours + "h " + minutes + "m";
	}

	public static guid(): string {
		// from http://stackoverflow.com/a/105074
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}

		return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
	}

	public static params(urlLocation: Location): any {

		const params: any = {};

		if (urlLocation) {
			const parts = urlLocation.search.substring(1).split("&");
			for (let i = 0; i < parts.length; i++) {
				const nv: string[] = parts[i].split("=");
				if (!nv[0]) {
					continue;
				}
				params[nv[0]] = nv[1] || true;
			}
		}
		return params;
	}

	public static safeMax(a: number, b: number): number {
		return a == null ? b : Math.max(a, b);
	}

	public static safeMin(a: number, b: number): number {
		return a == null ? b : Math.min(a, b);
	}

	public static convertMetersPerSecondsToKph(meterPerSeconds: number): number {
		return meterPerSeconds * 3.6;
	}

	public static sendMessage(extensionId: string, data: any, callback?: Function): Q.Promise<any>{
		const deferred: Q.Deferred<any> = Q.defer();
		// Sending message to background page
		if(window['chrome'])
			chrome.runtime.sendMessage(data.message,
				(response: any) => {
				if (callback) {
					callback(response.data);
				}
				deferred.resolve(response.data);
			});
		else {
			//sending message to content script
			this.sendToContentScript(
				 data,
				(d)=>{
					callback&&callback(d);
					deferred.resolve(d);
				}
			);
		}

		return deferred.promise;
	}


	public static sendToContentScript(data:any,callback?:Function){
		function processResult(event:any){
			if(event.data && event.data.direction === "from-content-script" &&
				event.data.message && event.data.method === (data.method + "_RESPONSE")){
				console.log("helper Rx",{method :event.data.method ,params:event.data.message.value});
				window.removeEventListener(event.type, processResult);
				callback && callback(event.data.message.value);
			}
			return true;
		}
		window.addEventListener("message", processResult );
		console.log("helper tx",data);
		window.postMessage(
			{direction: "from-page-script",message: data},
			"*"
		);


	}
}
