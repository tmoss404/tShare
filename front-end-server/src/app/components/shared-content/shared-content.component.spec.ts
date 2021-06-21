import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedContentComponent } from './shared-content.component';

describe('SharedContentComponent', () => {
  let component: SharedContentComponent;
  let fixture: ComponentFixture<SharedContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SharedContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
