import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService
  ) { }
  
  public getSignedUrl(fileToUpload: File) : Observable<any> {
    if(fileToUpload.name != null){
      let signUrlData = {
        loginToken: this.auth.getToken(),
        filePath: fileToUpload.name,
        fileType: fileToUpload.type
      }
      
      return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/upload`, signUrlData);
    } else {
      return null;
    }
  }

  public uploadFile(signedUrl: string, fileToUpload: File) : Observable<any>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  fileToUpload.type,
        'x-amz-acl': 'public-read'
      })
    };
    
    return this.http.put<any>(signedUrl, fileToUpload, httpOptions);
  }

  public getFiles() : Observable<any> {
    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/list`, {loginToken: this.auth.getToken()});
  }

}
