import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { CoordinationService } from '../timeline/service/coordination.service';

@Component({
    selector: 'timeline-canvas',
    imports: [CommonModule],
    templateUrl: './timeline-canvas.component.html',
    styleUrl: './timeline-canvas.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineCanvasComponent {

    highlight = viewChild<ElementRef>('highlight');
    el: ElementRef = inject(ElementRef);
    coordinationService: CoordinationService = inject(CoordinationService);

    ngAfterViewInit() {
        this.coordinationService.canvas = this.el.nativeElement;
        this.coordinationService.highlight = this.highlight()?.nativeElement;
    }
}
