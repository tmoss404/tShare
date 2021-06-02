import { Component, OnInit } from '@angular/core';
import { User } from '../User';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  userAccount: User = new User;
  termsOfService: boolean;

  constructor(private accountService: AccountService) { }

  ngOnInit(): void {
  }

  createAccount(){
    this.accountService.newAccount(this.userAccount).subscribe(data => console.log(data));
  }

}
