import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom } from 'rxjs';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-quick-access',
  templateUrl: './quick-access.component.html',
  styleUrls: ['./quick-access.component.css']
})
export class QuickAccessComponent implements OnInit {

  files : Array<any>;
  currentDir: string = null;

  constructor(
    private fileService: FileService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Get Quick Access files on Initialize
    this.getAllQuickAccessFiles();
  }

  // Get Quick Access Files Function
  async getAllQuickAccessFiles() : Promise<any> {
    this.files = undefined;

    const files$ = this.fileService.getQuickAccessFiles();

    await lastValueFrom(files$).then((success) => {
      this.files = success.favorites.Contents;
    }).catch((err) => {
      console.log("Error ocurred while trying to get quick access files " + err.error);
    });

  }

  downloadFile(file: any) : void {
    //We cannot download directories, so we disable the functionality for a file that is a directory
    if(!file.isDirectory){
      let filePath = file.Key.substring(file.Key.indexOf('/') + 1);

      this.fileService.getSignedUrlDownload(filePath).subscribe({
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

  removeFromFavorites(file: any) {
    let filePath = file.Key.substring(file.Key.indexOf('/') + 1);

     // Request to the back-end to remove favorite file
    this.fileService.removeQuickAccessFile(filePath, file.isDirectory).subscribe({
      next: (success) => {
        this.getAllQuickAccessFiles();
      },
      error: (err) => {
        console.log("Error ocurred while trying to remove the file to quick access" + err.error);
      }
    });
  }

  openRemoveModal(content: any, file: any) : void {
    this.modalService.open(content, {centered: true, windowClass: 'remove-file-modal', size: 'md'}).result.then((result) => {
      if(result == 'Remove')
        this.removeFromFavorites(file);
    }, () => {
      // Catch dismiss but do nothing since we don't have to do anything on dismiss
    }); 
  }

}
