import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessLevels } from 'src/app/Access-levels';

@Component({
  selector: 'app-request-access-modal',
  templateUrl: './request-access-modal.component.html',
  styleUrls: ['./request-access-modal.component.css']
})

export class RequestAccessModalComponent implements OnInit {

  requestAccessForm : FormGroup;
  @Input() currentDir : string;
  @Input() file : any;

  constructor(
    private formBuilder : FormBuilder,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    this.requestAccessForm = this.formBuilder.group({
      access: ['Read']
    });
  }

  submit(){
    let flags : Array<any> = [];

    flags.push(AccessLevels[this.requestAccessForm.controls['access'].value]);

    this.activeModal.close(flags);
  }

}
