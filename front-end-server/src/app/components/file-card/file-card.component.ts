import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AccountService } from 'src/app/services/account.service';
import { ContextMenuService, ContextMenuComponent } from 'ngx-contextmenu';

@Component({
  selector: 'app-file-card',
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent implements OnInit {

  @Input() file: any;
  @Input() contextMenu: ContextMenuComponent;

  @Output() changeDirEvent = new EventEmitter<string>();

  selected: boolean | false;
  dateFormat: string | 'M/d/yy, h:mm a';

  constructor(
    private accountService: AccountService,
    private contextMenuService: ContextMenuService
  ) { }

  ngOnInit(): void {
    if(this.file) this.file.name = this.getLastItem();
    this.dateFormat = this.accountService.getDateFormat();
  }

  getLastItem() : string {
    const fileRoute = this.file.Key;
    return this.file.Key.substring(fileRoute.lastIndexOf('/') + 1);
  }

  fileCardSelect() {
    this.selected = !this.selected;
  }

  onContextMenu($event: MouseEvent, file: any): void {
    this.contextMenuService.show.next({
      contextMenu: this.contextMenu,
      event: <any>$event,
      item: file
    });
    $event.preventDefault();
    $event.stopPropagation();
  }

  folderOpen() {
    if(this.file.isDirectory){
      this.changeDirEvent.emit(this.file.name);
    }
  }

}
