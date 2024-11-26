import { TestBed } from '@angular/core/testing';

import { NgPenService } from './ng-pen.service';

describe('NgPenService', () => {
  let service: NgPenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgPenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
