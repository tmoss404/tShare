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
  fileToUpload: File;
  currentDir: string = null;
  testDirName: string = "newer folder";
  newFolderForm: FormGroup;

  constructor(
    private fileService: FileService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
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
  }

  uploadFile(files: FileList) {
    if(files.item(0).name != null){
      this.fileToUpload = files.item(0);

      let signUrlReq = this.fileService.getSignedUrlUpload(this.fileToUpload, this.currentDir);
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

  openNewFolderModal(content) {
    this.newFolderForm = this.formBuilder.group({
      folderName: ['', [Validators.required, folderName()]]
    });

    this.modalService.open(content, {centered: true, windowClass: 'new-folder-modal', size: 'md'}); 
  }

  openCopyModal(content) {
    this.modalService.open(content, {centered: true, windowClass: 'copy-modal', size: 'md'}); 
  }

  openMoveModal(content) {
    this.modalService.open(content, {centered: true, windowClass: 'move-modal', size: 'md'}); 
  }

  createFolder(modal: any) {
    let folderName = this.newFolderForm.value.folderName;
    let newDir = this.currentDir != (null || undefined) ? this.currentDir + '/' + folderName : folderName;

    this.fileService.createDir(newDir).subscribe({
      next: (success) => {
        modal.close();
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

  goBack() {
    let newDir: string;

    if(this.currentDir != (null || undefined)){
      if(!this.currentDir.includes('/')) {
        newDir = null;
      }
      else {
        newDir = this.currentDir.substring(0, this.currentDir.lastIndexOf('/'));
      }
      this.getFiles(newDir).then(() => {
        this.currentDir = newDir;
      });
    }
  }

  downloadFile(file: any) {
    if(!file.isDirectory){
      let filePath: string;

      if(this.currentDir != (null || undefined)){
        filePath = this.currentDir + '/' + file.name;
      }
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

  
}
