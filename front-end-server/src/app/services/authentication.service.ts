import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

const helper = new JwtHelperService();

import { User } from '../User';

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

  constructor( private http: HttpClient) { }

  public getToken(): string {
    return localStorage.getItem('access_token');
  }

  public readToken(): any{
    const token = localStorage.getItem('access_token');
    return helper.decodeToken(token);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');

    if(token) {
      if(helper.isTokenExpired(token))
        return false;

      return true;
    } else {
      return false;
    }
  }

  login(user: User): Observable<any> {
    return this.http.post<any>('https://tshare-back-end.herokuapp.com/account/login', user);
  }  

  logout() {
    const token = { loginToken: localStorage.getItem("access_token") }
    return this.http.post<any>('https://tshare-back-end.herokuapp.com/account/logout', token);
  }
}
