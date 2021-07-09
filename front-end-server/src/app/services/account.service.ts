import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../User';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService
    ) { }

  newAccount(data: User) : Observable<any> {

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/register`, data);

  }

  recoverPassword(data: any) : Observable<any> {

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/forgot-password`, data);
  
  }

  resetPassword(resetId: number, data: any) : Observable<any> {

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/reset-password/` + resetId, data);

  }

  resetPasswordIdCheck(resetId: number) : Observable<any> {

    return this.http.get<any>(`https://tshare-back-end.herokuapp.com/account/check-password-reset/` + resetId);
  
  }

  changePassword(data: any) : Observable<any> {

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/change-password`, data);

  }

  updateAccountPreferences(data: any) {

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/update-preferences`, data);
  
  }

  getPreferences(data: any) {

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/get-preferences`, data);

  }

  setDateFormat(format: string) {

    localStorage.setItem('dateFormat', format);
  
  }

  getDateFormat() : string {

    if(localStorage.getItem('dateFormat'))
      return localStorage.getItem('dateFormat');
    else{
      const tokenData = { loginToken: this.auth.getToken() }
      this.getPreferences(tokenData).subscribe({
        next: (success) => {
          this.setDateFormat(success.preferences.dateFormat);
          return localStorage.getItem('dateFormat');
        },
        error: (err) => {
          console.log(err.error);
        }
      });
    }
      
  }

  clearDateFormat() : void {
    if(localStorage.getItem('dateFormat'))
      localStorage.removeItem('dateFormat');
  }
  
}
