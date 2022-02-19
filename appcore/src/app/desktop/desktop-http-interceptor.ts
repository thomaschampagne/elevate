import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { MachineService } from "./machine/machine.service";

@Injectable()
export class DesktopHttpInterceptor implements HttpInterceptor {
  constructor(@Inject(MachineService) private readonly machineService: MachineService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = this.machineService.authenticateRequest(request);
    return next.handle(request);
  }
}
