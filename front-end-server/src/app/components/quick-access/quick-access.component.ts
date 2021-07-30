import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-quick-access',
  templateUrl: './quick-access.component.html',
  styleUrls: ['./quick-access.component.css']
})
export class QuickAccessComponent implements OnInit {

  files : Array<any>;
  currentDir: string = null;

  constructor() { }

  ngOnInit(): void {
  }

}
