import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class UserLoggedInGuardService implements CanActivate {

  constructor(
    private auth: AuthenticationService,
    private router: Router
  ) { }

  canActivate(): boolean {

    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/my-files']);
      return false;
    }
    return true;
  }

}
