import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestAccessModalComponent } from './request-access-modal.component';

describe('RequestAccessModalComponent', () => {
  let component: RequestAccessModalComponent;
  let fixture: ComponentFixture<RequestAccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestAccessModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestAccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
