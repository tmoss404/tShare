import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CompanyComponent } from './company/company.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { HomeComponent } from './home/home.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ProductComponent } from './product/product.component';
import { RegisterComponent } from './register/register.component';
import { TermsOfServiceComponent } from './terms-of-service/terms-of-service.component';
import { GuardAuthService } from './guards/guard-auth.service';
import { UserLoggedInGuardService } from './guards/user-logged-in-guard.service';
import { MyFilesComponent } from './my-files/my-files.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { FileDashboardComponent } from './file-dashboard/file-dashboard.component';
import { SharedContentComponent } from './shared-content/shared-content.component';
import { RequestAccessComponent } from './request-access/request-access.component';
import { RequestsComponent } from './requests/requests.component';
import { QuickAccessComponent } from './quick-access/quick-access.component';
import { DeletedFilesComponent } from './deleted-files/deleted-files.component';

const routes: Routes = [
  {path: "home", component: HomeComponent},
  {path: "coming-soon", component: ComingSoonComponent},
  {path: "company", component: CompanyComponent},
  {path: "product", component: ProductComponent},
  {path: "contact-us", component: ContactUsComponent},
  {path: "login", component: LoginComponent, canActivate: [UserLoggedInGuardService]},
  {path: "file-dashboard", component: FileDashboardComponent,
    children: [
      {path: "my-files", component: MyFilesComponent},
      {path: "shared-content", component: SharedContentComponent},
      {path: "request-access", component: RequestAccessComponent},
      {path: "requests", component: RequestsComponent},
      {path: "quick-access", component: QuickAccessComponent},
      {path: "deleted-files", component: DeletedFilesComponent}
    ], 
    canActivate: [GuardAuthService]
  },
  {path: "register", component: RegisterComponent},
  {path: "terms-of-service", component: TermsOfServiceComponent},
  {path: "forgot-password", component: ForgotPasswordComponent},
  {path: "reset-password/:resetId", component: ResetPasswordComponent},
  {path: "", redirectTo: "/home", pathMatch: "full"},
  {path: "**", component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
