import { Component, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file.service';


@Component({
  selector: 'app-deleted-files',
  templateUrl: './deleted-files.component.html',
  styleUrls: ['./deleted-files.component.css']
})
export class DeletedFilesComponent implements OnInit {

  files : Array<any>;

  constructor(
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    // Get deleted files on Initialize
    this.getDeletedFiles();
  }

  // Get Deleted Files Function
  getDeletedFiles() : void {

    this.files = undefined;

    this.fileService.getDeletedFiles().subscribe({
      next: (success) => {
        this.files = success.data.Contents;
        console.log("Great Success - Deleted Files: " + JSON.stringify(this.files));
        
      },
      error: (err) => {
        console.log("Error ocurred while trying to get deleted files" + err.error);
      }
    })


  }


  // this.fileService.deleteFile(filePath).subscribe({
  //   next: (success) => {
  //     console.log("Great Success - File is deleted" + success + "filePath/Name: " + filePath);
  //     this.getFiles(this.currentDir);
  //   },
  //   error: (err) => {
  //     console.log("Error ocurred while trying to delete the file" + err.error);
  //   }
  // });

// // Async get DELETED files function
// async getDeletedFiles(dir: string) : Promise<any> {
//   this.files = undefined;

//   const files$ = this.fileService.getDeletedFiles(dir);
//   await lastValueFrom(files$).then((res) => {
//     this.files = res.data.Contents;
//     console.log(this.files);
//   }).catch((err) => {
//     console.log("An error ocurred while getting Deleted Files: " + err);
//   });
// }


}
