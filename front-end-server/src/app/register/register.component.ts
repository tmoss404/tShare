import { Component, OnInit } from '@angular/core';
import { User } from '../User';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  constructor(private accountService: AccountService) { }

  userAccount: User = new User;

  ngOnInit(): void {
  }

  createAccount( event: Event){
    event.preventDefault();

    console.log("Submit Submit!");
  }

}
