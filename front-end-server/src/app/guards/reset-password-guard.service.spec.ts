import { TestBed } from '@angular/core/testing';

import { ResetPasswordGuardService } from './reset-password-guard.service';

describe('ResetPasswordGuardService', () => {
  let service: ResetPasswordGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResetPasswordGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
