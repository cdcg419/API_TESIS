import { TestBed } from '@angular/core/testing';

import { ReportsPrediccionService } from './reports-prediccion.service';

describe('ReportsPrediccionService', () => {
  let service: ReportsPrediccionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportsPrediccionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
