import { TestBed } from '@angular/core/testing';

import { NotasEventService } from './notas-event.service';

describe('NotasEventService', () => {
  let service: NotasEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotasEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
