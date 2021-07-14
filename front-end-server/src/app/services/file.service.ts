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
  
  public getSignedUrl(fileToUpload: File, dir: string) : Observable<any> {
    if(fileToUpload.name != null){
      let filePath: string;
      if(dir != null) {
        filePath = dir + '/' + fileToUpload.name; 
      }
      else {
        filePath = fileToUpload.name;
      }

      let signUrlData = {
        loginToken: this.auth.getToken(),
        filePath: filePath,
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

  public getFiles(path: string) : Observable<any> {
    let getFilesData = { 
      loginToken: this.auth.getToken(),
      dirPath: path,
      showNestedFiles: false 
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/list`, getFilesData);
  }

  public createDir(path: string) : Observable<any> {
    let createDirData = {
      loginToken: this.auth.getToken(),
      dirPath: path
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/make-directory`, createDirData);
  }

}
