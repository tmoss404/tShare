import { Component, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-my-files',
  templateUrl: './my-files.component.html',
  styleUrls: ['./my-files.component.css']
})
export class MyFilesComponent implements OnInit {

  myFiles: Array<File> = [];
  fileToUpload: File;

  constructor(
    private fileService: FileService
  ) { }

  ngOnInit(): void {
  }

  getFiles(){
    this.fileService.getFiles().subscribe({
      next: (success) => {
        this.myFiles = success.s3Data.Contents;
        console.log(this.myFiles);
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
        this.fileService.uploadFile(success.signedUrlData, this.fileToUpload).subscribe((data)=>console.log(data));
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

}
