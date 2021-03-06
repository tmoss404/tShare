import { Component, OnInit } from '@angular/core';
import { User } from '../../User';
import { AccountService } from '../../services/account.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { confirmPassword } from '../../validators/confirmPassword.validator';
import { passwordFormat } from '../../validators/passwordFormat.validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  accountForm: FormGroup;
  userAccount: User = new User;
  response: any;

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.accountForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordFormat()]],
      confirm: ['', [Validators.required]],
      termsOfService: [false, [Validators.requiredTrue]]
    },
    {
      validators: [confirmPassword("password", "confirm")]
    });
  }

  createAccount(){
    
    this.userAccount.email = this.accountForm.controls['email'].value;
    this.userAccount.password = this.accountForm.controls['password'].value;

    this.accountService.newAccount(this.userAccount).subscribe({
      next: (success) => {
        this.response = success;
        this.accountForm.reset();
      },
      error: (err) => {
        this.response = err.error;
      }
    });

  }

  get form() { return this.accountForm.controls }

}
