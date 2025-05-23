import { TestBed } from '@angular/core/testing';

import { RegisterNotesService } from './register-notes.service';

describe('RegisterNotesService', () => {
  let service: RegisterNotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegisterNotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
