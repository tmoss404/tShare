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
    
    // Clone the existing request, and add the authorization header
    request = request.clone({
      setHeaders: {
        Authorization: `JWT ${this.a.getToken()}`
      }
    });
    // Pass the request on to the next handler
    return next.handle(request);
  }

}