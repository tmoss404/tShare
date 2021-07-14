import { Component, OnDestroy, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-my-files',
  templateUrl: './my-files.component.html',
  styleUrls: ['./my-files.component.css']
})
export class MyFilesComponent implements OnInit, OnDestroy {

  files: Array<any>;
  fileToUpload: File;
  filesSub: any;
  currentDir: string = null;
  testDirName: string = "new folder";

  constructor(
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    this.getFiles();
  }

  ngOnDestroy(): void {
    if(this.filesSub)
      this.filesSub.unsubscribe();
  }

  getFiles() {
    this.filesSub = this.fileService.getFiles(this.currentDir).subscribe({
      next: (success) => {
        this.files = success.data.Contents;
        console.log(this.files);
        console.log('Current directory: ' + this.currentDir);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  uploadFile(files: FileList) {
    if(files.item(0).name != null){
      this.fileToUpload = files.item(0);

      let signUrlReq = this.fileService.getSignedUrl(this.fileToUpload, this.currentDir);
      if (signUrlReq != null) {
        signUrlReq.subscribe({
          next: (success) => {
            this.fileService.uploadFile(success.signedUrlData, this.fileToUpload).subscribe({
              next: (success) => {
                this.getFiles();
              },
              error: (err) => {
                console.log(err.error);
              }
            });
          },
          error: (err) => {
            console.log(err.error);
          }
        });
      }
    }
  }

  createFolder() {
    let newDir = this.currentDir != null ? this.currentDir + '/' + this.testDirName : this.testDirName;
    this.fileService.createDir(newDir).subscribe({
      next: (success) => {
        this.getFiles();
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  changeCurrentDir(dirName: string) {
    if(this.currentDir == null) {
      this.currentDir = dirName;
    }
    else {
      this.currentDir = this.currentDir + '/' + dirName; 
    }

    this.getFiles();
  }

}
