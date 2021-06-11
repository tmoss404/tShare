import { TestBed } from '@angular/core/testing';

import { UserLoggedInGuardService } from './user-logged-in-guard.service';

describe('UserLoggedInGuardService', () => {
  let service: UserLoggedInGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserLoggedInGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
