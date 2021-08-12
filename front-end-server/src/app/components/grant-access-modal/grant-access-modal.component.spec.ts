import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantAccessModalComponent } from './grant-access-modal.component';

describe('GrantAccessModalComponent', () => {
  let component: GrantAccessModalComponent;
  let fixture: ComponentFixture<GrantAccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GrantAccessModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GrantAccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
