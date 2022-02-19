import { HttpClient, HttpResponse } from "@angular/common/http";
import { MachineService } from "./machine.service";
import { concat, Observable, OperatorFunction } from "rxjs";
import { catchError } from "rxjs/operators";
import { StatusCodes } from "http-status-codes";

export abstract class MachineAuthenticatedService {
  protected constructor(protected readonly httpClient: HttpClient, protected readonly machineService: MachineService) {}

  protected getAuthenticated(url: string): Observable<any> {
    return this.httpClient.get(url).pipe(this.ensureAuthenticated());
  }

  protected postAuthenticated(url: string, body: any | null): Observable<any> {
    return this.httpClient
      .post(url, body, {
        observe: "response"
      })
      .pipe(this.ensureAuthenticated());
  }

  protected ensureAuthenticated(): OperatorFunction<HttpResponse<any>, any> {
    return catchError((error, caught: Observable<HttpResponse<any>>) => {
      // If unauthorized try to authenticate before and replay request with concat
      if (error.status === StatusCodes.FORBIDDEN || error.status === StatusCodes.UNAUTHORIZED) {
        return concat(this.machineService.auth(), caught);
      }
      throw new Error(error);
    });
  }
}
