import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DraggerDirective } from '@richapps/rx-drag';
import { filter, finalize, fromEvent, Subject, switchMap, take, takeUntil, tap } from 'rxjs';

interface Point {
    x: number;
    y: number;
    controlPoint1?: Point;
    controlPoint2?: Point;
    centerPoint?: Point;
    type?: string;
    opposite?: Point;
}

interface Curve {
    controlPoint1: Point;
    controlPoint2: Point;
    endPoint: Point;
}

function distance(p1: Point, p2: Point) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;

    const c = Math.sqrt(a * a + b * b);
    return c;
}

function getAngle(p1: Point, p2: Point) {
    let angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return angle;
}

function isInWhichSegment(pathElement: any, x: number, y: number) {
    var seg;
    // You get get the coordinates at the length of the path, so you
    // check at all length point to see if it matches
    // the coordinates of the click
    const len = pathElement.getTotalLength();
    for (var i = 0; i < len; i++) {
        var pt = pathElement.getPointAtLength(i);
        // you need to take into account the stroke width, hence the +- 2
        if (pt.x < x + 2 && pt.x > x - 2 && pt.y > y - 2 && pt.y < y + 2) {
            seg = pathElement.getPathSegAtLength(i);
            break;
        }
    }
    return seg;
}

@Component({
    selector: 'app-root',
    imports: [DraggerDirective],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'pentool2';

    points: Point[] = [];

    d = '';
    connectionD = '';
    dragging = false;

    mode$ = new Subject<string>();
    mode = 'select';

    ngAfterViewInit() {
        fromEvent(window, 'keydown').subscribe((event: any) => {
            console.log('key down', event);
            if (event.code === 'Escape') {
            }

            if (event.key === 's') {
                this.mode = 'select';
            }

            if (event.key === 'p') {
                this.mode = 'pen';
            }
            // if (event.key === 'p') {
            //     this.mode = 'pen';
            // } else if (event.key === 's') {
            //     this.mode = 'select';
            // }
        });

        const mouseDown$ = fromEvent<MouseEvent>(window, 'mousedown');
        const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
        const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');

        let moves = 0;
        let downPoint: Point;

        mouseMove$.pipe(filter((x) => !this.dragging)).subscribe((evt: MouseEvent) => {
            if (this.mode === 'pen') {
                console.log('moving...');

                this.draw({ x: evt.clientX, y: evt.clientY, type: 'move' });
            }
        });

        mouseDown$
            .pipe(
                filter((x: any) => {
                    return this.mode === 'pen' && !x.target.classList.contains('point') && !x.target.classList.contains('inner');
                }),
                tap((downEvent: MouseEvent) => {
                    moves = 0;

                    downPoint = {
                        x: downEvent.clientX,
                        y: downEvent.clientY,
                        type: 'point',
                    };
                    this.draw();

                    this.points.push(downPoint);
                }),
                switchMap(() => {
                    return mouseMove$.pipe(
                        tap((dragMoveEvent) => {
                            if (moves === 3) {
                                const previousPoint = this.points[this.points.length - 2];
                                if (!previousPoint.controlPoint1) {
                                    previousPoint.controlPoint2 = {
                                        x: previousPoint.x,
                                        y: previousPoint.y,
                                        type: 'control',
                                    };
                                }

                                const controlPoint1: Point = {
                                    x: downPoint.x,
                                    y: downPoint.y,
                                    centerPoint: downPoint,
                                    type: 'control',
                                };

                                const controlPoint2: Point = {
                                    x: downPoint.x,
                                    y: downPoint.y,
                                    centerPoint: downPoint,
                                    opposite: controlPoint1,
                                    type: 'control',
                                };
                                controlPoint1.opposite = controlPoint2;
                                downPoint.controlPoint1 = controlPoint1;
                                downPoint.controlPoint2 = controlPoint2;
                                //this.points.push(downPoint);

                                // this.draw();
                            } else if (moves > 3) {
                                this.dragging = true;
                                if (downPoint.controlPoint1) {
                                    const diffX = dragMoveEvent.clientX - downPoint.x;
                                    const diffY = dragMoveEvent.clientY - downPoint.y;

                                    downPoint.controlPoint1.x = downPoint.x + -1 * diffX;
                                    downPoint.controlPoint1.y = downPoint.y + -1 * diffY;
                                }

                                if (downPoint.controlPoint2) {
                                    downPoint.controlPoint2.x = dragMoveEvent.clientX;
                                    downPoint.controlPoint2.y = dragMoveEvent.clientY;
                                }
                            }

                            moves++;
                            this.draw();
                        }),
                        finalize(() => {
                            this.dragging = false;

                            this.draw();
                        }),
                        takeUntil(mouseUp$),
                    );
                }),
            )
            .subscribe();
    }

    setMode(mode: string) {
        this.mode = mode;
    }

    draw(movePoint?: Point) {
        let d = '';
        let connectionD = '';

        const points = [...this.points];

        let i = 0;
        while (i < points.length) {
            const p = points[i];

            if (p.controlPoint2) {
                connectionD += `M${p.x} ${p.y} L${p.controlPoint2.x} ${p.controlPoint2.y}`;
            }
            if (p.controlPoint1) {
                connectionD += `M${p.x} ${p.y} L${p.controlPoint1.x} ${p.controlPoint1.y}`;
            }

            if (i === 0) {
                d += 'M' + p.x + ' ' + p.y;
            } else {
                const previousPoint = points[i - 1];
                if ((!previousPoint.controlPoint1 && !previousPoint.controlPoint2) || !p.controlPoint1) {
                    // line
                    d += ' L' + p.x + ' ' + p.y;
                } else {
                    d +=
                        ' C' +
                        previousPoint.controlPoint2?.x +
                        ' ' +
                        previousPoint.controlPoint2?.y +
                        ' ' +
                        p.controlPoint1?.x +
                        ' ' +
                        p.controlPoint1?.y +
                        ' ' +
                        p.x +
                        ' ' +
                        p.y;
                    //i++;
                }
            }

            i++;
        }

        this.d = d;
        this.connectionD = connectionD;
    }

    positionUpdated(point: Point, event: any) {
        const diffX = event.x - point.x;
        const diffY = event.y - point.y;
        point.x = event.x;
        point.y = event.y;

        if (point.controlPoint1) {
            point.controlPoint1.x += diffX;
            point.controlPoint1.y += diffY;
        }

        if (point.controlPoint2) {
            point.controlPoint2.x += diffX;
            point.controlPoint2.y += diffY;
        }

        if (point.opposite && point.centerPoint) {
            const diffX = point.x - point.centerPoint.x;
            const diffY = point.y - point.centerPoint.y;

            point.opposite.x = point.centerPoint.x + -1 * diffX;
            point.opposite.y = point.centerPoint.y + -1 * diffY;
        }
        this.draw();
    }

    onPathClick(evt: any) {
        const segIndex = isInWhichSegment(evt.target, evt.clientX, evt.clientY);
        const segment = evt.target.getPathData()[segIndex];

        if (segment.type === 'L') {
            const p = this.points.find((p) => p.x === segment.values[0] && p.y === segment.values[1]);
            if (p) {
                const pointIndex = this.points.indexOf(p);
                const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
                const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');
                const previousPoint = this.points[pointIndex - 1];
                let moveCount = 0;

                mouseMove$.pipe(takeUntil(mouseUp$)).subscribe((evt: MouseEvent) => {
                    moveCount++;

                    const mousePoint = {
                        x: evt.clientX,
                        y: evt.clientY,
                    };

                    if (moveCount > 3) {
                        // Convert line to curve

                        if (!previousPoint.controlPoint2) {
                            previousPoint.controlPoint2 = { x: 0, y: 0, type: 'curve' };
                        }

                        if (!p.controlPoint1) {
                            p.controlPoint1 = { x: 0, y: 0, type: 'curve' };
                        }

                        const c1 = previousPoint.controlPoint2;
                        const c2 = p.controlPoint1;

                        let angle1 = getAngle(mousePoint, previousPoint);
                        const distance1 = distance(previousPoint, mousePoint);
                        const radius1 = distance1 * 0.7;
                        c1.x = previousPoint.x + Math.cos(angle1) * radius1;
                        c1.y = previousPoint.y + Math.sin(angle1) * radius1;

                        let angle2 = getAngle(mousePoint, p);
                        const distance2 = distance(p, mousePoint);
                        const radius2 = distance2 * 0.7;
                        c2.x = p.x + Math.cos(angle2) * radius2;
                        c2.y = p.y + Math.sin(angle2) * radius2;
                    }
                    this.draw();
                });
            }
        }

        if (segment.type === 'C') {
            const p = this.points.find((p) => p.x === segment.values[0] && p.y === segment.values[1]);
            console.log('p ', p);
            if (p) {
                const pointIndex = this.points.indexOf(p as Point);
                console.log('Point Index', pointIndex);
            }
        }
    }
}
