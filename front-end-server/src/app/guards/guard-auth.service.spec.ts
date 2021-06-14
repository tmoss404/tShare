import { TestBed } from '@angular/core/testing';

import { GuardAuthService } from './guard-auth.service';

describe('GuardAuthService', () => {
  let service: GuardAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuardAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
