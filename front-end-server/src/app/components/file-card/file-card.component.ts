import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-file-card',
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent implements OnInit {

  @Input() file: any;

  constructor() { }

  ngOnInit(): void {
    if(this.file)
      this.file.name = this.getLastItem();
  }

  getLastItem() : string {
    const fileRoute = this.file.Key;
    return this.file.Key.substring(fileRoute.lastIndexOf('/') + 1);
  }
}
