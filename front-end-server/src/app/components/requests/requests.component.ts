import { Component, OnInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit {

  activeRequests: Array<any>;

  constructor(
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.getActiveRequests();
  }

  async getActiveRequests() {
    this.activeRequests = undefined;

    const requests$ = this.permissionService.listRequests();
    await lastValueFrom(requests$).then((res) => {
      this.activeRequests = res.permissionRequests;
      console.log(this.activeRequests);
    }).catch((err) => {
      console.log(err);
    });
  }

  answerRequest(data: any) : void {
    if(data.approve) {
      this.permissionService.approveRequest(data.requestId).subscribe({
        next: (success) => {
          this.getActiveRequests();
        },
        error: (err) => {
          console.log(err.error);
        }
      });
    }
    else {
      this.permissionService.denyRequest(data.requestId).subscribe({
        next: (success) => {
          this.getActiveRequests();
        },
        error: (err) => {
          console.log(err.error);
        }
      });
    }
  }

}
