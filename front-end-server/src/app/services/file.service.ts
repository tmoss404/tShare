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
  
  public getSignedUrlUpload(fileToUpload: File, filePath: string) : Observable<any> {
    if(fileToUpload.name != null){
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

  public uploadFile(signedUrl: string, fileToUpload: File) : Observable<any> {
    const httpOptions : Object = {
      headers: new HttpHeaders({
        'Content-Type':  fileToUpload.type,
        'x-amz-acl': 'public-read'
      }),
      reportProgress: true,
      observe: "events"
    };
    
    return this.http.put(signedUrl, fileToUpload, httpOptions);
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

  // Add Quick Access File
  public addQuickAccessFile(path: string, isDirectory: boolean) : Observable<any> {
    const quickAccessFileData = {
      loginToken: this.auth.getToken(),
      path: path,
      isDirectory: isDirectory
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/favorite/add`, quickAccessFileData);
  }

  // Quick Access Remove
  public removeQuickAccessFile(path: string, isDirectory: boolean) : Observable<any> {
    const removeQuickAccessData = {
      loginToken: this.auth.getToken(),
      path: path,
      isDirectory: isDirectory
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/favorite/remove`, removeQuickAccessData)
  }

  // Get Quick Access Files
  public getQuickAccessFiles() : Observable<any> {
    const getQuickAccessFilesData = { 
      loginToken: this.auth.getToken()
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/favorite/list`, getQuickAccessFilesData);
  }

  // Permanent delete, delete from recycle bin
  public purgeFile(path: string, isDirectory: boolean) : Observable<any> {
    const purgeFileData = {
      loginToken: this.auth.getToken(),
      path: path,
      isDirectory: isDirectory
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/recycle/delete`, purgeFileData)
  }

  // Permanent delete, delete all files from recycle bin
  public purgeAllFiles() : Observable<any> {
    const purgeFileData = {
      loginToken: this.auth.getToken(),
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/recycle/delete-all`, purgeFileData)
  }

  // Get Deleted Files
  public getDeletedFiles(path: string) : Observable<any> {
    const getDeletedFilesData = { 
      loginToken: this.auth.getToken(),
      dirPath: path,
      showNestedFiles: false 
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/recycle/list`, getDeletedFilesData);
  }

  public deleteFile(path: string, isDirectory: boolean) : Observable<any> {
    const deleteFileData = {
      loginToken: this.auth.getToken(),
      path: path,
      isDirectory: isDirectory
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/delete`, deleteFileData);
  }

  public getFiles(path: string) : Observable<any> {
    const getFilesData = { 
      loginToken: this.auth.getToken(),
      dirPath: path,
      showNestedFiles: false 
    }

    return this.http.post<any>(`https://tshare-back-end.herokuapp.com/file/list`, getFilesData);
  }

  public getDirectories(path: string) : Observable<any> {
    const getFilesData = { 
      loginToken: this.auth.getToken(),
      dirPath: path,
      showNestedFiles: false,
      onlyDirs: true 
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
