import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { confirmPassword } from '../../validators/confirmPassword.validator';
import { passwordFormat } from '../../validators/passwordFormat.validator';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  resetForm: FormGroup;
  info: any;
  response: any;

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, passwordFormat()]],
      confirm: ['', [Validators.required]]
    },
    {
      validators: [confirmPassword("password", "confirm")]
    });

  }

  submit() {
    this.info = { newPassword: this.resetForm.controls['password'].value };

    this.accountService.resetPassword(this.route.snapshot.params['resetId'], this.info).subscribe({
      next: (success) => {
        this.response = success;
        this.resetForm.reset();
      },
      error: (err) => {
        this.response = err.error;
      }
    });
  }

  get form() { return this.resetForm.controls }

}
