import { Component, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  selector: 'app-shared-content',
  templateUrl: './shared-content.component.html',
  styleUrls: ['./shared-content.component.css']
})
export class SharedContentComponent implements OnInit {

  sharedFiles: Array<any>;

  constructor(
    private permissionService: PermissionService,
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    this.getSharedFiles();
  }

  getSharedFiles() {
    this.permissionService.listShared().subscribe({
      next: (success) => {
        this.sharedFiles = success.files.Contents;
        console.log(this.sharedFiles);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  downloadFile(file: any) : void {
    //We cannot download directories, so we disable the functionality for a file that is a directory
    if(!file.isDirectory){
      let filePath = this.getFilePath(file.name);

      this.permissionService.getSignedUrlDownload(filePath, file.owner.accountId).subscribe({
        next: (success) => {
          this.fileService.downloadFile(success.signedUrl).subscribe({
            next: (success) => {
              console.log(success);
              let blob = new Blob([success], { type: success.type});
          
              let downloadLink = document.createElement('a');
              downloadLink.href = window.URL.createObjectURL(blob);
              if (file.name)
                  downloadLink.setAttribute('download', file.name);
              document.body.appendChild(downloadLink);
              downloadLink.click();
            },
            error: (err) => {
              console.log(err);
            }
          });
        },
        error: (err) => {
          console.log(err.error);
        }
      });
    }
  }

  getFilePath(path: string) : string {
    return path.substring(path.indexOf('/') + 1);
  }

}
