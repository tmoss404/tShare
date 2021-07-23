import { Component, OnInit } from '@angular/core';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-request-access',
  templateUrl: './request-access.component.html',
  styleUrls: ['./request-access.component.css']
})
export class RequestAccessComponent implements OnInit {

  users : Array<any>;

  constructor(
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers() : void {
    this.users = undefined;
    
    this.accountService.getUsers().subscribe({
      next: (success) => {
        this.users = success.users;
        console.log(this.users);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

}
