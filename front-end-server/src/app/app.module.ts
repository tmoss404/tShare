/* Modules */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { ContextMenuModule } from 'ngx-contextmenu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

/* Components */
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ProductComponent } from './components/product/product.component';
import { CompanyComponent } from './components/company/company.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { TermsOfServiceComponent } from './components/terms-of-service/terms-of-service.component';
import { MyFilesComponent } from './components/my-files/my-files.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { FileDashboardComponent } from './components/file-dashboard/file-dashboard.component';
import { SharedContentComponent } from './components/shared-content/shared-content.component';
import { RequestAccessComponent } from './components/request-access/request-access.component';
import { RequestsComponent } from './components/requests/requests.component';
import { QuickAccessComponent } from './components/quick-access/quick-access.component';
import { DeletedFilesComponent } from './components/deleted-files/deleted-files.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { AccountPreferencesComponent } from './components/account-preferences/account-preferences.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { FileCardComponent } from './components/file-card/file-card.component';
import { RequestAccessModalComponent } from './components/request-access-modal/request-access-modal.component';

/* Services */
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { UserCardComponent } from './components/user-card/user-card.component';
import { RequestCardComponent } from './components/request-card/request-card.component';
import { GrantAccessModalComponent } from './components/grant-access-modal/grant-access-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    HeaderComponent,
    HomeComponent,
    PageNotFoundComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ProductComponent,
    CompanyComponent,
    ContactUsComponent,
    TermsOfServiceComponent,
    MyFilesComponent,
    ResetPasswordComponent,
    FileDashboardComponent,
    SharedContentComponent,
    RequestAccessComponent,
    RequestsComponent,
    QuickAccessComponent,
    DeletedFilesComponent,
    ComingSoonComponent,
    AccountPreferencesComponent,
    ChangePasswordComponent,
    FileCardComponent,
    UserCardComponent,
    RequestAccessModalComponent,
    RequestCardComponent,
    GrantAccessModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgbModule,
    ContextMenuModule.forRoot({
      useBootstrap4: true
    })
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptorService,
    multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
