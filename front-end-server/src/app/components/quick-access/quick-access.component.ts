import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom } from 'rxjs';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-quick-access',
  templateUrl: './quick-access.component.html',
  styleUrls: ['./quick-access.component.css']
})
export class QuickAccessComponent implements OnInit {

  files : Array<any>;
  currentDir: string = null;

  constructor(
    private fileService: FileService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Get Quick Access files on Initialize
    this.getAllQuickAccessFiles();
  }

   // Get Deleted Files Function
   async getAllQuickAccessFiles() : Promise<any> {

    this.files = undefined;

    const files$ = this.fileService.getQuickAccessFiles();

    await lastValueFrom(files$).then((success) => {
      this.files = success.favorites;
      console.log("Great Success - Quick Access Files: " + JSON.stringify(this.files));
    }).catch((err) => {
      console.log("Error ocurred while trying to get quick access files " + err);
    });

  }

}
