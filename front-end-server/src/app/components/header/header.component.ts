import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { Location } from '@angular/common';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(
    private router: Router,
    private auth: AuthenticationService,
    private accountService: AccountService,
    private location: Location
  ) { }

  public token: any;
  
  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart || event instanceof NavigationEnd) { // read the token on "NavigationStart / NavigationEnd"
        this.token = this.auth.readToken();
      }
    });
  }
  
  logout() {
    if(this.auth.isAuthenticated){
      this.auth.logout().subscribe({
        next: (success) => {
          this.accountService.clearDateFormat();
          this.auth.clearToken();
        },
        error: (err) => {
          console.log(err.error.message);
        }
      });
    }else {
      this.router.navigate['/login'];
    }
  }

  dashboardActive() {
    let relativePath : string = this.location.path();
    return relativePath === '/file-hub/my-files' || relativePath === '/file-hub/shared-content' || 
            relativePath === '/file-hub/request-access' || relativePath === '/file-hub/requests' ||
            relativePath === '/file-hub/quick-access' || relativePath === '/file-hub/deleted-files';
  }
}