import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AccessLevels } from 'src/app/Access-levels';

@Component({
  selector: 'app-request-card',
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.css']
})
export class RequestCardComponent implements OnInit {

  @Input() request: any;

  @Output() answerRequestEvent = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
    this.loadData();
  }

  setFilePath() : void {
    let fileRoute = this.request.requestedFile.path;
    this.request.requestedFile.path = fileRoute.substring(fileRoute.indexOf('/') + 1);
  }

  loadData() : void {
    this.setFilePath();
    this.request.accessString = AccessLevels[this.request.permissionFlags];
  }

  approve() : void {
    let approveData = {
      approve: true,
      requestId: this.request.requestId
    }

    this.answerRequestEvent.emit(approveData);
  }

  deny() : void {
    let denyData = {
      approve: false,
      requestId: this.request.requestId
    }

    this.answerRequestEvent.emit(denyData);
  }
}
