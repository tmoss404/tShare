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

  getFiles(){
    this.filesSub = this.fileService.getFiles().subscribe({
      next: (success) => {
        this.files = success.data.Contents;
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  uploadFile(files: FileList){
    if(files.item(0).name != null){
      this.fileToUpload = files.item(0);

      let signUrlReq = this.fileService.getSignedUrl(this.fileToUpload);
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

}
