import { AfterViewInit, Directive, ElementRef, EventEmitter, Output, inject } from '@angular/core';
import { fromEvent, map, switchMap, takeUntil } from 'rxjs';

@Directive({
    selector: '[draggable]',
    standalone: true,
})
export class DragableDirective implements AfterViewInit {
    el: ElementRef = inject(ElementRef);
    @Output()
    dragging: EventEmitter<any> = new EventEmitter<any>();

    ngAfterViewInit() {
        let parentRect: DOMRect;
        const target = this.el.nativeElement;
        const mousedown$ = fromEvent<MouseEvent>(target, 'mousedown');
        const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove');
        const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');

        const drag$ = mousedown$.pipe(
            switchMap((mouseDownEvent) => {
                parentRect = target.parentElement.getBoundingClientRect();
                return mousemove$.pipe(
                    map((mouseMoveEvent) => {
                        return {
                            left: mouseMoveEvent.clientX - mouseDownEvent.offsetX,
                            top: mouseMoveEvent.clientY - mouseDownEvent.offsetY,
                        };
                    }),
                    takeUntil(mouseup$),
                );
            }),
        );

        drag$.subscribe(({ left, top }) => {
            // target.style.left = left + 'px';
            // target.style.top = top + 'px';
            let x = left - parentRect.left;

            x = Math.max(0, x);
            target.style.transform = `translateX(${x}px)`;
            this.dragging.emit({ x });
        });
    }
}
