import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  constructor(private a: AuthenticationService) { }

  // Methods

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    if(request.url.match(/t-share-front-end/)){
      request = request.clone({
        setHeaders: {
          Authorization: `JWT ${this.a.getToken()}`
        }
      });
      
      return next.handle(request);
    }
    else{
      return next.handle(request);
    }
  }

}