import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom } from 'rxjs';
import { FileService } from 'src/app/services/file.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { folderName } from '../../validators/folderName.validator';

@Component({
  selector: 'app-my-files',
  templateUrl: './my-files.component.html',
  styleUrls: ['./my-files.component.css']
})
export class MyFilesComponent implements OnInit {

  files: Array<any>;
  currentDir: string = null;
  newFolderForm: FormGroup;

  constructor(
    private fileService: FileService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.getFiles(this.currentDir);
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

    let filePath: string;

    //Add a slash to the route if you are not in the root directory
    if(this.currentDir != (null || undefined)){
      filePath = this.currentDir + '/' + file.name;
    }
    // File path is simply the name of the file if you are currently in the root directory
    else {
      filePath = file.name;
    }

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

  downloadFile(file: any) : void {
    //We cannot download directories, so we disable the functionality for a file that is a directory
    if(!file.isDirectory){
      let filePath: string;

      //Add a slash to the route if you are not in the root directory
      if(this.currentDir != (null || undefined)){
        filePath = this.currentDir + '/' + file.name;
      }
      //File path is simply the name of the file if you are currently in the root directory
      else {
        filePath = file.name;
      }

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
    if(files.item(0).name != null){
      let fileToUpload = files.item(0);

      let signUrlReq = this.fileService.getSignedUrlUpload(fileToUpload, this.currentDir);
      if (signUrlReq != null) {
        signUrlReq.subscribe({
          next: (success) => {
            this.fileService.uploadFile(success.signedUrlData, fileToUpload).subscribe({
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

  //Opens the modal for creating a new folder
  openNewFolderModal(content) : void {
    //Creates a formgroup for entering the folder name
    this.newFolderForm = this.formBuilder.group({
      folderName: ['', [Validators.required, folderName()]]
    });

    this.modalService.open(content, {centered: true, windowClass: 'new-folder-modal', size: 'md'}); 
  }

  openCopyModal(copycontent) {
    this.modalService.open(copycontent, {centered: true, windowClass: 'copy-modal', size: 'md'}); 
  }

  openMoveModal(movecontent) {
    this.modalService.open(movecontent, {centered: true, windowClass: 'move-modal', size: 'md'}); 
  }

  //Creates a new folder in the system on submit of the modal form, takes the modal as an arg to close it on submit
  createFolder(modal: any) {
    //Get the user input from the form
    let folderName = this.newFolderForm.value.folderName;
    //If the current dir is the root then the new dir is simply the name of the directory, if not, add a slash in between
    let newDir = this.currentDir != (null || undefined) ? this.currentDir + '/' + folderName : folderName;

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
    let newDir = this.currentDir == (null || undefined) ? dirName : this.currentDir + '/' + dirName;

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

}
