import { Component, OnInit } from '@angular/core';
import { AccountService } from '../services/account.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  emailForm: FormGroup;
  info: any;
  response: any;

  constructor(private accountService: AccountService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit(){
    this.info = { email: this.emailForm.controls['email'].value };

    this.accountService.recoverPassword(this.info).subscribe({
      next: (success) => {
        this.response = success;
      },
      error: (err) => {
        this.response = err.error;
      }
    });
  }

}
