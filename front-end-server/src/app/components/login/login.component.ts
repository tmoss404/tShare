import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AccountService } from 'src/app/services/account.service';
import { User } from 'src/app/User';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm : FormGroup;
  user: User = new User;
  response : {
    message: string,
    success: boolean
  }

  constructor( 
    private auth : AuthenticationService,
    private accountService : AccountService,
    private router : Router, 
    private formBuilder : FormBuilder
  ) { }

  ngOnInit() : void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  login() : void {
    this.user = this.loginForm.value;
    
    this.auth.login(this.user).subscribe({
      next: (success) => {
        this.auth.setToken(success.loginToken);

        const tokenData = { loginToken : this.auth.getToken() }
        this.accountService.getPreferences(tokenData).subscribe({
          next: (success) => {
            this.accountService.setDateFormat(success.preferences.dateFormat);
          },
          error: (err) => {
            console.log(err.error);
          }
        });

        this.router.navigate(['/file-dashboard/my-files']);
      },
      error: (err) => {
        this.response = err.error;
      }
    });

  }

  get form() { return this.loginForm.controls }

}
