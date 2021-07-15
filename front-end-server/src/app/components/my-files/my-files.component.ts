import { Component, OnDestroy, OnInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-my-files',
  templateUrl: './my-files.component.html',
  styleUrls: ['./my-files.component.css']
})
export class MyFilesComponent implements OnInit {

  files: Array<any>;
  fileToUpload: File;
  currentDir: string = null;
  testDirName: string = "newer folder";

  constructor(
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    this.getFiles(this.currentDir);
  }

  async getFiles(dir: string) {
    this.files = undefined;

    const files$ = this.fileService.getFiles(dir);
    await lastValueFrom(files$).then((res) => {
      this.files = res.data.Contents;
    }).catch((err) => {
      console.log(err);
    });
    console.log('Current directory: ' + this.currentDir);
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
                this.getFiles(this.currentDir);
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
    let newDir = this.currentDir != (null || undefined) ? this.currentDir + '/' + this.testDirName : this.testDirName;
    console.log(newDir);
    this.fileService.createDir(newDir).subscribe({
      next: (success) => {
        this.getFiles(this.currentDir);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  changeCurrentDir(dirName: string) {
    let newDir = this.currentDir == (null || undefined) ? dirName : this.currentDir + '/' + dirName;

    this.getFiles(newDir).then(() => {
      this.currentDir = newDir;
    });
  }

}
