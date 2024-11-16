import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { DragableDirective } from '../../../directives/dragable.directive';

@Component({
    selector: 'timeline-ruler',
    standalone: true,
    imports: [CommonModule, DragableDirective],
    templateUrl: './timeline-ruler.component.html',
    styleUrl: './timeline-ruler.component.scss',
})
export class TimelineRulerComponent {
    unitPatterPath = '';
    patternWidth = 0;
    patternHeight = 30;

    private el: ElementRef = inject(ElementRef);

    private _pixelsPerMilliseconds = 0.01;
    public get pixelsPerMilliseconds() {
        return this._pixelsPerMilliseconds;
    }
    @Input()
    public set pixelsPerMilliseconds(value) {
        this._pixelsPerMilliseconds = value;
        this.update();
    }

    @Output()
    dragging: EventEmitter<any> = new EventEmitter<any>();

    @Input()
    position = 0;

    inited = false;

    times: string[] = [];

    ngAfterViewInit() {
        this.inited = true;
        this.update();
    }

    update() {
        if (!this.inited) {
            return;
        }

        const rect = this.el.nativeElement.getBoundingClientRect();

        const spacePerSecond = 1000 * this.pixelsPerMilliseconds;
        const spacePerTenSeconds = 10 * spacePerSecond;
        const spacePerMinute = 60 * spacePerSecond;

        let unitSpace = spacePerTenSeconds;

        this.times = [];

        if (spacePerSecond > 5) {
            unitSpace = spacePerSecond;
            this.patternWidth = unitSpace * 10;
            const timeCount = rect.width / this.patternWidth;

            for (let i = 0; i < timeCount; i++) {
                this.times.push(`${i * 10}s`);
            }
        } else if (spacePerTenSeconds > 5) {
            unitSpace = spacePerTenSeconds;
            this.patternWidth = unitSpace * 10;

            const timeCount = rect.width / this.patternWidth;

            for (let i = 0; i < timeCount; i++) {
                this.times.push(`${i * 100}s`);
            }
        } else {
            console.log('---- minutes');
            unitSpace = spacePerMinute;
            this.patternWidth = unitSpace * 10;

            const timeCount = rect.width / this.patternWidth;

            for (let i = 0; i < timeCount; i++) {
                this.times.push(`${i * 10}min`);
            }
        }

        this.unitPatterPath = '';

        for (let i = 0; i < 10; i++) {
            if (i === 0) {
                this.unitPatterPath += `M ${unitSpace * i} ${this.patternHeight} v -${this.patternHeight / 1.2}`;
            } else if (i === 5) {
                this.unitPatterPath += `M ${unitSpace * i} ${this.patternHeight} v -${this.patternHeight / 2}`;
            } else {
                this.unitPatterPath += `M ${unitSpace * i} ${this.patternHeight} v -${this.patternHeight / 4}`;
            }
        }
    }

    onDragging(e: any) {
        this.dragging.emit(e);
    }
}
