import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom } from 'rxjs';
import { AccountService } from 'src/app/services/account.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { PermissionService } from 'src/app/services/permission.service';
import { RequestAccessModalComponent } from '../request-access-modal/request-access-modal.component';

@Component({
  selector: 'app-request-access',
  templateUrl: './request-access.component.html',
  styleUrls: ['./request-access.component.css']
})
export class RequestAccessComponent implements OnInit {

  users : Array<any>;
  selectedUser : any = null;
  userFiles : Array<any>;
  currentDir : string = null;

  constructor(
    private accountService: AccountService,
    private permissionService: PermissionService,
    private auth: AuthenticationService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getUsers();
  }

  //Async get files function, returning a promise so I can execute certain operations after it resolves
  async getFiles(dir: string, accountId: number) : Promise<any> {
    this.userFiles = undefined;

    const files$ = this.permissionService.getFiles(dir, accountId);
    await lastValueFrom(files$).then((res) => {
      this.userFiles = res.data.Contents;
    }).catch((err) => {
      console.log(err);
    });
  }

  changeCurrentDir(dirName: string) : void {
    //If the current dir is the root then the new dir is simply the name of the directory, if not, add a slash in between
    let newDir = this.getFilePath(dirName);

    //Update files array
    this.getFiles(newDir, this.selectedUser.accountId).then(() => {
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
      this.getFiles(newDir, this.selectedUser.accountId).then(() => {
        //Only change the current directory once the request completes and the files are updated
        this.currentDir = newDir;
      });
    }
  }

  //Function to go back in the directory structure
  backToUsers() : void {
    this.selectedUser = null;
    this.currentDir = null;
    this.userFiles = undefined;
    this.getUsers();
  }

  getUsers() : void {
    this.users = undefined;
    
    this.accountService.getUsers().subscribe({
      next: (success) => {
        this.users = success.users.filter((element) => {
          //Filter the current user out of the returned list
          return element.accountId != this.auth.readToken().accountId;
        })
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  selectUser(user: any){
    this.getFiles(null, user.accountId).then(() => {
      this.selectedUser = user;
    });
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

  //Opens the modal for creating a new folder
  openRequestAccessModal(file: any) : void {
    if(!file.isDirectory){
      const requestModalRef = this.modalService.open(RequestAccessModalComponent, {centered: true, windowClass: 'new-folder-modal', size: 'md'});
      requestModalRef.componentInstance.file = file;
      requestModalRef.componentInstance.currentDir = this.currentDir;
  
      requestModalRef.result.then((result) => {
        const filePath = this.getFilePath(file.name);
        
        this.permissionService.requestAccess(filePath, this.selectedUser.accountId, result)
          .subscribe({
            next: (success) => {
              console.log(success);
            },
            error: (err) => {
              console.log(err.error);
            }
          });
      }, () => {
        // Catch dismiss but do nothing since we don't have to do anything on dismiss
      });
    }
  }

}
