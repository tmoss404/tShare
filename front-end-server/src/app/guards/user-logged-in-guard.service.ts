import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

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
      this.router.navigate(['/file-dashboard/my-files']);
      return false;
    }
    return true;
  }

}
