import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(
    private router : Router,
    private auth : AuthenticationService
  ) { }

  public token: any;
  
  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart || event instanceof NavigationEnd) { // read the token on "NavigationStart / NavigationEnd"
        this.token = this.auth.readToken();
      }
    });
  }
  
  logout(){
    if(this.auth.isAuthenticated){
      this.auth.logout().subscribe({
        next: (success) => {
          this.auth.clearToken();
          console.log(success.message);
        },
        error: (err) => {
          console.log(err.error.message);
        }
      });
    }else {
      this.router.navigate['/login'];
    }
  }
}