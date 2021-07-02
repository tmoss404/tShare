import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { confirmPassword } from '../../validators/confirmPassword.validator';
import { passwordFormat } from '../../validators/passwordFormat.validator';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  passwordForm: FormGroup;
  passwordInfo: any;
  response: any;

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private auth: AuthenticationService,
  ) { }

  ngOnInit(): void {
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPass: ['', [Validators.required]],
      confirm: ['', [Validators.required]],
    
    },
    {
      validators: [confirmPassword("newPass", "confirm"), passwordFormat()]
    });
  }

  submit(){

    this.passwordInfo = { loginToken: this.auth.getToken(),
                          newPassword: this.passwordForm.controls['newPass'].value,
                          currentPassword: this.passwordForm.controls['currentPassword'].value, };

    this.accountService.changePassword(this.passwordInfo).subscribe({
      next: (success) => {
        this.response = success;
      },
      error: (err) => {
        this.response = err.error;
      }
    });
  }

  get form() { return this.passwordForm.controls }
}
