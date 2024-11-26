import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgPenComponent } from './ng-pen.component';

describe('NgPenComponent', () => {
  let component: NgPenComponent;
  let fixture: ComponentFixture<NgPenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgPenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgPenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
