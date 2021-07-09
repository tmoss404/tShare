import { Component, Input, OnInit } from '@angular/core';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-file-card',
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent implements OnInit {

  @Input() file: any;
  selected: boolean | false;
  dateFormat: string | 'M/d/yy, h:mm a';

  constructor(
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    if(this.file)
      this.file.name = this.getLastItem();

    this.dateFormat = this.accountService.getDateFormat();
  }

  getLastItem() : string {
    const fileRoute = this.file.Key;
    return this.file.Key.substring(fileRoute.lastIndexOf('/') + 1);
  }

  fileCardSelect(){
    this.selected = !this.selected;
  }
}
