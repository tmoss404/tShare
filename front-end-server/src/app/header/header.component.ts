import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private router : Router, private auth : AuthenticationService) { }

  public token: any;
  
  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart || event instanceof NavigationEnd) { // only read the token on "NavigationStart"
        this.token = this.auth.readToken();
      }
    });
  }

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("expires_at");
  }
  
}