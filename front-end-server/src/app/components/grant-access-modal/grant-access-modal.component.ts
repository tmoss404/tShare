import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessLevels } from 'src/app/Access-levels';
import { AccountService } from 'src/app/services/account.service';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-grant-access-modal',
  templateUrl: './grant-access-modal.component.html',
  styleUrls: ['./grant-access-modal.component.css']
})
export class GrantAccessModalComponent implements OnInit {

  grantAccessForm : FormGroup;
  users : Array<any>;
  @Input() currentDir : string;
  @Input() file : any;

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private auth: AuthenticationService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    this.getUsers();

    this.grantAccessForm = this.formBuilder.group({
      user: [null],
      access: ['Read']
    });
  }

  getUsers() : void {
    this.users = undefined;
    
    this.accountService.getUsers().subscribe({
      next: (success) => {
        this.users = success.users.filter((element: any) => {
          //Filter the current user out of the returned list
          return element.accountId != this.auth.readToken().accountId;
        })
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

  submit(){
    let flags : Array<any> = [];
    flags.push(AccessLevels[this.grantAccessForm.controls['access'].value]);

    const grantAccessData = {
      flags: flags,
      accountId: this.grantAccessForm.controls['user'].value.accountId,
      filePath: this.getFilePath(this.file.name)
    }

    this.activeModal.close(grantAccessData);
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
