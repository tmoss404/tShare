import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from './services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tShare';

  constructor(private router: Router, private auth: AuthenticationService){
    const events = this.router.events.pipe(filter(event=>event instanceof NavigationEnd));
  
    events.subscribe((e) => {
      if(this.auth.getToken())
        if(!this.auth.isAuthenticated()){
          this.auth.clearToken();
        }
    });
  }
}


