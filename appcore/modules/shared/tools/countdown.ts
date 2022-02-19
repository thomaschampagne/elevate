import { Observable, timer } from "rxjs";
import { scan, takeWhile } from "rxjs/operators";

export const countdown: (seconds: number) => Observable<number> = (seconds: number) => {
  return timer(0, 1000).pipe(
    scan(acc => --acc, seconds + 1),
    takeWhile(x => x >= 0)
  );
};
