import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.css']
})
export class UserCardComponent implements OnInit {

  @Input() user: any;

  @Output() selectUserEvent = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  userSelect() {
    this.selectUserEvent.emit(this.user);
  }

}
