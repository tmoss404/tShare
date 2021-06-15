import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../User';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private http: HttpClient) { }

  newAccount(data: User): Observable<any>{

    return this.http.post<any>(`http://tshare-back-end.herokuapp.com/account/register`, data);

  }

  recoverPassword(data: any){

    return this.http.post<any>(`http://tshare-back-end.herokuapp.com/account/forgot-password`, data);
  
  }

  resetPassword(resetId: number, data: any){

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/account/reset-password/` + resetId, data);

  }
}
