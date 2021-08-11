import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService
  ) { }

  public getFiles(path: string, accountId: number) : Observable<any> {
    const getFilesData = { 
      loginToken: this.auth.getToken(),
      dirPath: path,
      showNestedFiles: false,
      targetAccountId: accountId
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/list-files`, getFilesData);
  }

  public requestAccess(path: string, accountId: number, flags: any) : Observable<any> {
    const requestAccessData = {
      loginToken: this.auth.getToken(),
      path: path,
      isDirectory: false,
      requesteeAccountId: accountId,
      permissionFlags: flags 
    }

    console.log(requestAccessData);

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/request`, requestAccessData);
  }

  public listRequests() : Observable<any> {
    const listRequestData = {
      loginToken: this.auth.getToken()
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/list-pending`, listRequestData);
  }

  public approveRequest(requestId: number) : Observable<any> {
    const approveData = {
      loginToken: this.auth.getToken(),
      requestId: requestId
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/accept`, approveData)
  }

  public denyRequest(requestId: number) : Observable<any> {
    const denyData = {
      loginToken: this.auth.getToken(),
      requestId: requestId
    }
    
    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/deny`, denyData)
  }

  public listShared() : Observable<any> {
    const listSharedData = {
      loginToken: this.auth.getToken()
    }
    
    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/list-shared`, listSharedData)
  }

  public getSignedUrlDownload(filePath: string, accountId: number) :Observable<any> {
    const signUrlData = {
      loginToken: this.auth.getToken(),
      filePath: filePath,
      targetAccountId: accountId
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/permission/download`, signUrlData);

  }


}
