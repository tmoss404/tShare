import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileDashboardComponent } from './file-dashboard.component';

describe('FileDashboardComponent', () => {
  let component: FileDashboardComponent;
  let fixture: ComponentFixture<FileDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
