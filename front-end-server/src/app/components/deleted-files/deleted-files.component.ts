import { Component, OnInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-deleted-files',
  templateUrl: './deleted-files.component.html',
  styleUrls: ['./deleted-files.component.css']
})
export class DeletedFilesComponent implements OnInit {

  files : Array<any>;
  currentDir: string = null;

  constructor(
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    // Get deleted files on Initialize
    this.getDeletedFiles(this.currentDir);
  }

  changeCurrentDir(dirName: string) : void {
    //If the current dir is the root then the new dir is simply the name of the directory, if not, add a slash in between
    let newDir = this.currentDir == (null || undefined) ? dirName : this.currentDir + '/' + dirName;

    //Update files array
    this.getDeletedFiles(newDir).then(() => {
      //Only change the current directory once the request completes and the files are updated
      this.currentDir = newDir;
    });
  }

  //Function to go back in the directory structure
  goBack() : void {
    //Placeholder for the new directory
    let newDir: string;

    //If the current directory is not the root dir
    if(this.currentDir != (null || undefined)){
      //If the current directory is the first directory past the root, redirect to the root
      if(!this.currentDir.includes('/')) {
        newDir = null;
      }
      //Remove the last directory from the route to navigate one backwards
      else {
        newDir = this.currentDir.substring(0, this.currentDir.lastIndexOf('/'));
      }
      //Update the files array
      this.getDeletedFiles(newDir).then(() => {
        //Only change the current directory once the request completes and the files are updated
        this.currentDir = newDir;
      });
    }
  }

  // Get Deleted Files Function
  async getDeletedFiles(dir: string) : Promise<any> {

    this.files = undefined;

    const files$ = this.fileService.getDeletedFiles(dir);

    await lastValueFrom(files$).then((success) => {
      this.files = success.data.Contents;
      console.log("Great Success - Deleted Files: " + JSON.stringify(this.files));
    }).catch((err) => {
      console.log("Error ocurred while trying to get deleted files " + err);
    });

  }

  deleteFile(file: any) : void {

    let filePath: string;

    //Add a slash to the route if you are not in the root directory
    if(this.currentDir != (null || undefined)){
      filePath = this.currentDir + '/' + file.name;
    }
    // File path is simply the name of the file if you are currently in the root directory
    else {
      filePath = file.name;
    }

    this.fileService.purgeFile(filePath, file.isDirectory).subscribe({
      next: (success) => {
        this.getDeletedFiles(this.currentDir);
      },
      error: (err) => {
        console.log(err.error);
      }
    });
    
  }

}
