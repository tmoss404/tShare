import { Component, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-my-files',
  templateUrl: './my-files.component.html',
  styleUrls: ['./my-files.component.css']
})
export class MyFilesComponent implements OnInit {

  files: Array<any> = [];
  fileToUpload: File;

  constructor(
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    this.getFiles();
  }

  getFiles(){
    this.fileService.getFiles().subscribe({
      next: (success) => {
        this.files = success.s3Data.Contents;
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  uploadFile(files: FileList){
    this.fileToUpload = files.item(0);
    this.fileService.getSignedUrl(this.fileToUpload).subscribe({
      next: (success) => {
        this.fileService.uploadFile(success.signedUrlData, this.fileToUpload).subscribe(() => this.getFiles());
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

}
