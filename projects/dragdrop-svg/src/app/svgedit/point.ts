import { Subject, takeUntil } from 'rxjs';
import { makeDraggable } from './drag.util';

export class Point {
    private _x: number = 0;
    public get x(): number {
        return this._x;
    }
    public set x(value: number) {
        this._x = value;
        this.update();
    }
    private _y: number = 0;
    public get y(): number {
        return this._y;
    }
    public set y(value: number) {
        this._y = value;
        this.update();
    }

    controlPoint1?: Point;
    controlPoint2?: Point;
    opposite?: Point;
    centerPoint?: Point;

    ref: SVGCircleElement;

    destroy$ = new Subject<void>();

    constructor(
        private parent: any,
        public type: string,
        private draw: () => void,
        private draggedBy: (point: Point, diffX: number, diffY: number) => void,
    ) {
        this.ref = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.ref.setAttribute('cx', '0');
        this.ref.setAttribute('cy', '0');
        if (this.type === 'control') {
            this.ref.setAttribute('r', '3');
        } else {
            this.ref.setAttribute('r', '4');
        }
        this.ref.setAttribute('fill', '#fff');
        this.ref.classList.add(this.type);
        this.ref.classList.add('point');

        const editorControls = this.parent.querySelector('.editorControls');
        editorControls.appendChild(this.ref);

        this.makeDraggable();
    }

    makeDraggable() {
        const { dragStart$, dragMove$, dragEnd$ } = makeDraggable(this.ref);

        let parentRect = this.parent.getBoundingClientRect();

        let dragStartX = 0;
        let dragStartY = 0;

        dragStart$.pipe(takeUntil(this.destroy$)).subscribe(() => {
            dragStartX = this.x;
            dragStartY = this.y;
        });

        dragMove$.pipe(takeUntil(this.destroy$)).subscribe((move) => {
            const offsetX = move.originalEvent.x - move.startOffsetX;
            const offsetY = move.originalEvent.y - move.startOffsetY;

            const x = offsetX - parentRect.left;
            const y = offsetY - parentRect.top;
            const diffX = dragStartX + x - this.x;
            const diffY = dragStartY + y - this.y;

            this.x = dragStartX + x;
            this.y = dragStartY + y;

            this.draggedBy(this, diffX, diffY);
        });
    }

    update() {
        this.ref.setAttribute('cx', this.x + '');
        this.ref.setAttribute('cy', this.y + '');
        this.draw();
    }

    destroy() {
        this.ref.remove();
        if (this.controlPoint1) {
            this.controlPoint1.destroy();
        }
        if (this.controlPoint2) {
            this.controlPoint2.destroy();
        }
        this.destroy$.next();
    }
}
