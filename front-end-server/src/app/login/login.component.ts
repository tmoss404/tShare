import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm : FormGroup;

  response : {
    message: string,
    success: boolean
  }

  constructor( 
    private auth : AuthenticationService,
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

    const user = this.loginForm.value;
    
    this.auth.login(user).subscribe({
      next: (success) => {
        const expiresAt = moment().add(success.expiresIn,'second');

        localStorage.setItem( 'access_token', success.loginToken );
        localStorage.setItem( "expires_at", JSON.stringify(expiresAt.valueOf()) );
        this.router.navigate(['/my-files']);
      },
      error: (err) => {
        this.response = err.error;
      }
    });

  }

  get form() { return this.loginForm.controls }

}
