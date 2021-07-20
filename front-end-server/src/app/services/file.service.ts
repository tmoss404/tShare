import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService
  ) { }
  
  public getSignedUrlUpload(fileToUpload: File, dir: string) : Observable<any> {
    if(fileToUpload.name != null){
      let filePath: string;
      if(dir != (null || undefined)) {
        filePath = dir + '/' + fileToUpload.name; 
      }
      else {
        filePath = fileToUpload.name;
      }

      const signUrlData = {
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

  public getSignedUrlDownload(filePath: string) :Observable<any> {
    const signUrlData = {
      loginToken: this.auth.getToken(),
      filePath: filePath
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/download`, signUrlData);

  }

  public downloadFile(signedUrl: string) : Observable<any> {

    return this.http.get<any>(signedUrl, {responseType: 'blob' as 'json'});

  }

  public getFiles(path: string) : Observable<any> {
    const getFilesData = { 
      loginToken: this.auth.getToken(),
      dirPath: path,
      showNestedFiles: false 
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/list`, getFilesData);
  }

  public createDir(path: string) : Observable<any> {
    const createDirData = {
      loginToken: this.auth.getToken(),
      dirPath: path
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/make-directory`, createDirData);
  }

}
