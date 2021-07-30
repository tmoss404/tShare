import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal, NgbProgressbar} from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom, Subscription } from 'rxjs';
import { FileService } from 'src/app/services/file.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { folderName } from '../../validators/folderName.validator';
import { HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-my-files',
  templateUrl: './my-files.component.html',
  styleUrls: ['./my-files.component.css']
})
export class MyFilesComponent implements OnInit, OnDestroy {

  files: Array<any>;
  currentDir: string = null;
  newFolderForm: FormGroup;
  uploadProgress: number;
  uploadSub: Subscription;

  constructor(
    private fileService: FileService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.getFiles(this.currentDir);
  }

  ngOnDestroy(): void {
    if(this.uploadSub)
      this.uploadSub.unsubscribe();
  }

  //Async get files function, returning a promise so I can execute certain operations after it resolves
  async getFiles(dir: string) : Promise<any> {
    this.files = undefined;

    const files$ = this.fileService.getFiles(dir);
    await lastValueFrom(files$).then((res) => {
      this.files = res.data.Contents;
    }).catch((err) => {
      console.log(err);
    });
  }

  /* BEGIN DELETE FILE */
  deleteFile(file: any) : void {

    let filePath = this.getFilePath(file.name);

       // Request to the back-end to delete the file
    this.fileService.deleteFile(filePath, file.isDirectory).subscribe({
      next: (success) => {
        this.getFiles(this.currentDir);
        console.log("Great Success - " + filePath + " is deleted.");
      },
      error: (err) => {
        console.log("Error ocurred while trying to delete the file" + err.error);
      }
    });
    
    
  }
  /*END DELETE FILE */

 /* BEGIN QUICK ACCESS FILE */
 addToFavoriteFile(file: any) : void {

  let filePath = this.getFilePath(file.name);

     // Request to the back-end to add favorite file
  this.fileService.addQuickAccessFile(filePath, file.isDirectory).subscribe({
    next: (success) => {
      this.getFiles(this.currentDir);
      console.log("Great Success - " + filePath + " is added to quick access.");
    },
    error: (err) => {
      console.log("Error ocurred while trying to add the file to quick access" + err.error);
    }
  });
  
  
}
/*END QUICK ACCESS FILE */

  downloadFile(file: any) : void {
    //We cannot download directories, so we disable the functionality for a file that is a directory
    if(!file.isDirectory){
      let filePath = this.getFilePath(file.name);

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


  uploadFile(files: FileList) : void {
    //Contingency for weird error with file input, trying to read null file name
    if(files){
      let fileToUpload = files.item(0);

      let signUrlReq = this.fileService.getSignedUrlUpload(fileToUpload, this.getFilePath(fileToUpload.name));
      if (signUrlReq != null) {
        signUrlReq.subscribe({
          next: (success) => {
            const upload$ = this.fileService.uploadFile(success.signedUrlData, fileToUpload).pipe(
              finalize(() => { 
                this.uploadProgress = null;
                this.uploadSub = null;
                this.getFiles(this.currentDir);
              })
            );

            this.uploadSub = upload$.subscribe(event => {
              if (event.type == HttpEventType.UploadProgress) {
                this.uploadProgress = Math.round(100 * (event.loaded / event.total));
              }
            })

          },
          error: (err) => {
            console.log(err.error);
          }
        });
      }
    }
  }

  //Opens the modal for creating a new folder
  openNewFolderModal(content: any) : void {
    //Creates a formgroup for entering the folder name
    this.newFolderForm = this.formBuilder.group({
      folderName: ['', [Validators.required, folderName()]]
    });

    this.modalService.open(content, {centered: true, windowClass: 'new-folder-modal', size: 'md'}); 
  }

  //Opens the modal for renaming a file / folder
  /* openRenameModal(content: any) : void {
    //Creates a formgroup for entering the new name
    let renameForm = this.formBuilder.group({
      newName: ['', [Validators.required, folderName()]]
    });

    this.modalService.open(content, {centered: true, windowClass: 'rename-modal', size: 'md'}); 
  } */

  openCopyModal(content: any) {
    this.modalService.open(content, {centered: true, windowClass: 'copy-modal', size: 'md'}); 
  }

  openMoveModal(content: any) {
    this.modalService.open(content, {centered: true, windowClass: 'move-modal', size: 'md'}); 
  }

  openDeleteModal(content: any, file: any) : void {
    this.modalService.open(content, {centered: true, windowClass: 'delete-file-modal', size: 'sm'}).result.then((result) => {
      if(result == 'Delete')
        this.deleteFile(file);
    }, () => {
      // Catch dismiss but do nothing since we don't have to do anything on dismiss
    }); 
  }

  //Creates a new folder in the system on submit of the modal form, takes the modal as an arg to close it on submit
  createFolder(modal: any) {
    //Get the user input from the form
    let folderName = this.newFolderForm.value.folderName;
    //If the current dir is the root then the new dir is simply the name of the directory, if not, add a slash in between
    let newDir = this.getFilePath(folderName);

    //Post request to the back-end to create the folder
    this.fileService.createDir(newDir).subscribe({
      next: (success) => {
        //Close the modal on success and update the files array
        modal.close();
        this.getFiles(this.currentDir);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
    
  }

  //Changes current directory to the specified directory
  changeCurrentDir(dirName: string) : void {
    //If the current dir is the root then the new dir is simply the name of the directory, if not, add a slash in between
    let newDir = this.getFilePath(dirName);

    //Update files array
    this.getFiles(newDir).then(() => {
      //Only change the current directory once the request completes and the files are updated
      this.currentDir = newDir;
    });
  }

  //Function to go back in the directory structure
  goBack() : void {
    //Placeholder for the new directory
    let newDir: string;

    //If the current directory is not the root dir
    if(this.currentDir != (null || undefined)){
      //If the current directory is the first directory past the root, redirect to the root
      if(!this.currentDir.includes('/')) {
        newDir = null;
      }
      //Remove the last directory from the route to navigate one backwards
      else {
        newDir = this.currentDir.substring(0, this.currentDir.lastIndexOf('/'));
      }
      //Update the files array
      this.getFiles(newDir).then(() => {
        //Only change the current directory once the request completes and the files are updated
        this.currentDir = newDir;
      });
    }
  }

  //Compile a proper path for a file / directory based on what the current directory is
  getFilePath(fileName: string) : string {
    //Add a slash to the route if you are not in the root directory
    if(this.currentDir != (null || undefined)){
      return this.currentDir + '/' + fileName;
    }
    // File path is simply the name of the file / dir if you are currently in the root directory
    else {
      return fileName;
    }
  }

}
