import { Component, OnInit } from '@angular/core';
import { User } from '../User';
import { AccountService } from '../account.service';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ConfirmPassword } from './confirmPassword.validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  accountForm: FormGroup;
  userAccount: User = new User;

  constructor(private accountService: AccountService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.accountForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      //Minimum 9 characters
      password: ['', [Validators.required]],
      confirm: ['', [Validators.required]],
      termsOfService: [false, [Validators.requiredTrue]]
    },
    {
      validators: ConfirmPassword("password", "confirm")
    });
  }

  createAccount(){
    //this.accountService.newAccount(this.userAccount).subscribe(data => console.log(data));
    console.log(this.accountForm.get('termsOfService').value);
  }

  get form() { return this.accountForm.controls }

}
