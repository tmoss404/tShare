import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from 'src/app/services/account.service';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-account-preferences',
  templateUrl: './account-preferences.component.html',
  styleUrls: ['./account-preferences.component.css']
})
export class AccountPreferencesComponent implements OnInit {

  userEmail: string;
  formats: Array<string> = ['M/d/yy, h:mm a', 'MMM d, y, h:mm:ss a', 'MMMM d, y, h:mm:ss a z', 'M/d/yy', 'MMM d, y', 'MMMM d, y', 'EEEE, MMMM d, y'];
  userPreference: string;
  preferencesForm: FormGroup;

  response : {
    message: string,
    success: boolean
  }

  constructor(
    private auth: AuthenticationService,
    private accountService: AccountService, 
    private formBuilder : FormBuilder
  ) { }

  ngOnInit(): void {
    this.userEmail = this.auth.readToken().email;
    this.userPreference = this.accountService.getDateFormat();

    this.preferencesForm = this.formBuilder.group({
      dateFormat: [this.userPreference ? this.userPreference : 'M/d/yy, h:mm a', [Validators.required]]
    });
  }

  apply() : void {
    const preferenceData = {
      loginToken: this.auth.getToken(),
      preferences: this.preferencesForm.value
    }

    this.accountService.updateAccountPreferences(preferenceData).subscribe({
      next: (success) => {
        this.response = success;
        this.accountService.setDateFormat(this.preferencesForm.controls['dateFormat'].value);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
  }

}
