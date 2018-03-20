import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class OptionHelperReaderService {

	constructor(private http: HttpClient) {
	}

	public get(markdownTemplate: string): Promise<string> {

		return new Promise<string>((resolve, reject) => {
			const httpGetSubscription = this.http.get(markdownTemplate, {responseType: "text"}).subscribe(markdownData => {
				resolve(markdownData);
			}, error => {
				reject(error);
			}, () => {
				httpGetSubscription.unsubscribe();
			});
		});

	}
}
