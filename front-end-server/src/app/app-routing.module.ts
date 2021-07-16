import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CompanyComponent } from './components/company/company.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { HomeComponent } from './components/home/home.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { LoginComponent } from './components/login/login.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { ProductComponent } from './components/product/product.component';
import { RegisterComponent } from './components/register/register.component';
import { TermsOfServiceComponent } from './components/terms-of-service/terms-of-service.component';
import { GuardAuthService } from './guards/guard-auth.service';
import { UserLoggedInGuardService } from './guards/user-logged-in-guard.service';
import { MyFilesComponent } from './components/my-files/my-files.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { FileDashboardComponent } from './components/file-dashboard/file-dashboard.component';
import { SharedContentComponent } from './components/shared-content/shared-content.component';
import { RequestAccessComponent } from './components/request-access/request-access.component';
import { RequestsComponent } from './components/requests/requests.component';
import { QuickAccessComponent } from './components/quick-access/quick-access.component';
import { DeletedFilesComponent } from './components/deleted-files/deleted-files.component';
import { AccountPreferencesComponent } from './components/account-preferences/account-preferences.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ResetPasswordGuardService } from './guards/reset-password-guard.service';

const routes: Routes = [
  {path: "home", component: HomeComponent},
  {path: "coming-soon", component: ComingSoonComponent},
  {path: "company", component: CompanyComponent},
  {path: "product", component: ProductComponent},
  {path: "contact-us", component: ContactUsComponent},
  {path: "login", component: LoginComponent, canActivate: [UserLoggedInGuardService]},
  {path: "file-hub", component: FileDashboardComponent,
    children: [
      {path: "my-files", component: MyFilesComponent},
      {path: "shared-content", component: SharedContentComponent},
      {path: "request-access", component: RequestAccessComponent},
      {path: "requests", component: RequestsComponent},
      {path: "quick-access", component: QuickAccessComponent},
      {path: "deleted-files", component: DeletedFilesComponent},
      {path: '',   redirectTo: '/file-dashboard/my-files', pathMatch: 'full'},
    ], 
    canActivate: [GuardAuthService]
  },
  {path: "account-preferences", 
    children: [
      {path: "change-password", component: ChangePasswordComponent},
      {path: "", component: AccountPreferencesComponent}
    ],
    canActivate: [GuardAuthService]
  },
  {path: "register", component: RegisterComponent},
  {path: "terms-of-service", component: TermsOfServiceComponent},
  {path: "forgot-password", component: ForgotPasswordComponent},
  {path: "reset-password/:resetId", component: ResetPasswordComponent, canActivate: [ResetPasswordGuardService]},
  {path: "", redirectTo: "/home", pathMatch: "full"},
  {path: "**", component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
