import { fromEvent, last, map, startWith, switchMap, takeUntil } from 'rxjs';

const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

export function makeDraggable(element: any) {
  const mouseDown$ = fromEvent<MouseEvent>(element, 'mousedown');

  const dragStart$ = mouseDown$;
  const dragMove$ = dragStart$.pipe(
    switchMap((start) =>
      mouseMove$.pipe(
        map((moveEvent) => ({
          originalEvent: moveEvent,
          deltaX: moveEvent.pageX - start.pageX,
          deltaY: moveEvent.pageY - start.pageY,
          startOffsetX: start.offsetX,
          startOffsetY: start.offsetY,
        })),
        takeUntil(mouseUp$),
      ),
    ),
  );

  // dragMove$.subscribe((move) => {
  //   const offsetX = move.originalEvent.x - move.startOffsetX;
  //   const offsetY = move.originalEvent.y - move.startOffsetY;
  //   element.style.left = offsetX + 'px';
  //   element.style.top = offsetY + 'px';
  // });

  const dragEnd$ = dragStart$.pipe(
    switchMap((start) =>
      mouseMove$.pipe(
        startWith(start),
        map((moveEvent) => ({
          originalEvent: moveEvent,
          deltaX: moveEvent.pageX - start.pageX,
          deltaY: moveEvent.pageY - start.pageY,
          startOffsetX: start.offsetX,
          startOffsetY: start.offsetY,
        })),
        takeUntil(mouseUp$),
        last(),
      ),
    ),
  );

  return { dragStart$, dragMove$, dragEnd$ };
}
