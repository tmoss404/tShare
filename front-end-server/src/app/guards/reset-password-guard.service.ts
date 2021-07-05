import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AccountService } from '../services/account.service';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordGuardService implements CanActivate {

  constructor(
    private accountService: AccountService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<boolean> {

    return this.accountService.resetPasswordIdCheck(+route.params['resetId']).pipe(map((response: {success: boolean}) => {
      if(response.success) {
        return true;
      }
    }), catchError((error: any) => {
      this.router.navigate(['/home']);
      return of(false);
    }));

  }
}
