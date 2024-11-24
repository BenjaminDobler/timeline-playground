import { Component, ElementRef, HostBinding, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DraggerDirective } from '@richapps/rx-drag';
import { filter, finalize, fromEvent, NEVER, Subject, switchMap, take, takeUntil, tap } from 'rxjs';

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

function insertAt(arr: any[], position: number, item: any) {
    const newArray = [...arr.slice(0, position), item, ...arr.slice(position)];
    return newArray;
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

    isOverLine = false;
    isCurveDragging = false;
    isOverPoint = false;

    svgCanvas = viewChild<ElementRef>('svg_canvas');

    private _selectedPathElement?: SVGPathElement | undefined;
    public get selectedPathElement(): SVGPathElement | undefined {
        return this._selectedPathElement;
    }
    public set selectedPathElement(value: SVGPathElement | undefined) {
        console.log('SET PATH ELEMENT ', value);
        if (value !== this._selectedPathElement && value) {
            this.generatePointsFromPath(value);
            this.selectedPathElement$.next(value);
        } else if (!value) {
            console.log('clear values');
            this.points = [];
        }

        this._selectedPathElement = value;
        this.draw();
    }

    selectedPathElement$: Subject<SVGPathElement> = new Subject<SVGPathElement>();

    @HostBinding('class.pen-cursor')
    get penCursor() {
        return this.mode === 'pen' && !(this.keyAltDown && this.overPoint);
    }

    @HostBinding('class.pen-minus')
    get penMinusCursor() {
        return this.mode === 'pen' && this.keyAltDown && this.overPoint;
    }

    @HostBinding('class.curve-cursor')
    get curveCursor() {
        return this.mode === 'select' && (this.isOverLine || this.isCurveDragging);
    }

    keyAltDown = false;
    keyMetaDown = false;

    generatePointsFromPath(path: SVGPathElement) {
        const segments = (path as any).getPathData();

        const points: Point[] = [];

        segments.forEach((seg: any, index: number) => {
            const previousPoint = points[points.length - 1];
            if (seg.type === 'M') {
                points.push({
                    x: seg.values[0],
                    y: seg.values[1],
                });
            }
            if (seg.type === 'L') {
                points.push({
                    x: seg.values[0],
                    y: seg.values[1],
                });
            }
            if (seg.type === 'C') {
                const point: Point = {
                    x: seg.values[4],
                    y: seg.values[5],
                };

                const controlPoint1: Point = {
                    x: seg.values[0],
                    y: seg.values[1],
                    centerPoint: previousPoint,
                };
                const controlPoint2: Point = {
                    x: seg.values[2],
                    y: seg.values[3],
                    centerPoint: point,
                };

                point.controlPoint1 = controlPoint2;
                previousPoint.controlPoint2 = controlPoint1;

                if (previousPoint.controlPoint1 && previousPoint.controlPoint2) {
                    previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
                    previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
                }

                points.push(point);
            }
        });

        this.points = points;

        // this.draw();
    }

    ngAfterViewInit() {
        // this.selectedPathElement$.pipe(switchMap((x) => fromEvent(x, 'mousedown'))).subscribe(($event) => {
        //     this.onPathClick($event);
        // });

        // this.selectedPathElement$
        //     .pipe(
        //         tap((x) => {
        //             console.log('add mouse over listener!!!!', x);
        //         }),
        //         switchMap((x) => fromEvent(x, 'mouseover')),
        //     )
        //     .subscribe(($event) => {
        //         console.log('mouse over');
        //         this.mouseOverPath($event);
        //     });

        // this.selectedPathElement$.pipe(switchMap((x) => fromEvent(x, 'mouseout'))).subscribe(($event) => {
        //     this.mouseOutPath($event);
        // });

        fromEvent(window, 'keydown').subscribe((event: any) => {
            if (event.code === 'Escape') {
            }

            if (event.key === 's') {
                this.mode = 'select';
            }

            if (event.key === 'p') {
                this.mode = 'pen';
            }

            this.keyAltDown = event.altKey;

            if (event.key === 'Meta') {
                this.keyMetaDown = true;
            }
        });

        fromEvent(window, 'keyup').subscribe((event: any) => {
            this.keyAltDown = false;
            this.keyMetaDown = false;
        });

        const mouseDown$ = fromEvent<MouseEvent>(window, 'mousedown');
        const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
        const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');

        let moves = 0;
        let downPoint: Point;

        mouseMove$.pipe(filter((x) => !this.dragging)).subscribe((evt: MouseEvent) => {
            if (this.mode === 'pen') {
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

                    this.points.push(downPoint);
                    console.log('ADD POINT ======');
                    this.draw();
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
        console.log('draw ', this.points);
        if (this.points.length > 0 && !this.selectedPathElement) {
            const canvas = this.svgCanvas();
            if (canvas) {
                console.log('add new path! ', canvas.nativeElement);

                const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                newPath.setAttribute('fill', 'none');
                newPath.setAttribute('stroke', '#fff');
                if (this.points.length > 0) {
                    newPath.setAttribute('d', `M${this.points[0].x, this.points[0].y}`);
                }

                fromEvent(newPath, 'mousedown').subscribe(($event) => {
                    console.log('on mousedown path!');
                    this.onPathClick($event);
                });

                fromEvent(newPath, 'mouseover').subscribe(($event) => {
                    console.log('mouse over');
                    this.mouseOverPath($event);
                });

                fromEvent(newPath, 'mouseout').subscribe(($event) => {
                    this.mouseOutPath($event);
                });

                canvas.nativeElement.appendChild(newPath);
                const pointsBefore = [...this.points];
                this.selectedPathElement = newPath;
                this.points = pointsBefore;
            }
        }
        console.log('points ', this.points);
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

        // this.d = d;
        this.connectionD = connectionD;

        if (this.selectedPathElement) {
            this.selectedPathElement.setAttribute('d', d);
        }
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
        if (this.selectedPathElement !== evt.target) {
            console.log('set selected path ', evt.target);
            this.selectedPathElement = evt.target;
            return;
        }
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
                this.isCurveDragging = true;

                mouseMove$
                    .pipe(
                        takeUntil(mouseUp$),
                        finalize(() => {
                            if (moveCount < 3) {
                                this.points = insertAt(this.points, pointIndex, {
                                    x: evt.clientX,
                                    y: evt.clientY,
                                });
                            }
                            this.isCurveDragging = false;
                        }),
                    )
                    .subscribe((evt: MouseEvent) => {
                        moveCount++;

                        const mousePoint = {
                            x: evt.clientX,
                            y: evt.clientY,
                        };

                        if (moveCount > 3) {
                            // Convert line to curve

                            if (!previousPoint.controlPoint2) {
                                previousPoint.controlPoint2 = { x: 0, y: 0, type: 'curve', centerPoint: previousPoint };
                                if (previousPoint.controlPoint1) {
                                    previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
                                    previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
                                }
                            }

                            if (!p.controlPoint1) {
                                p.controlPoint1 = { x: 0, y: 0, type: 'curve', centerPoint: p };
                                if (p.controlPoint2) {
                                    p.controlPoint2.opposite = p.controlPoint1;
                                    p.controlPoint1.opposite = p.controlPoint2;
                                }
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
            if (p) {
                const pointIndex = this.points.indexOf(p as Point);
            }
        }
    }

    mouseOverPath(evt: any) {
        const segIndex = isInWhichSegment(evt.target, evt.clientX, evt.clientY);
        const segment = evt.target.getPathData()[segIndex];

        if (segment.type === 'L') {
            this.isOverLine = true;
        }
    }

    mouseOutPath($event: any) {
        this.isOverLine = false;
    }

    onPointClick(event: MouseEvent, point: Point) {
        if (event.altKey) {
            this.points = this.points.filter((p) => p !== point);
            this.draw();
        }
    }

    overPoint(event: MouseEvent) {
        this.isOverPoint = true;
    }

    outPoint(event: MouseEvent) {
        this.isOverPoint = false;
    }

    onCanvas(evt: any) {
        console.log('on canvas ', evt);
        if (this.mode === 'select' && evt.target.getAttribute('id') === 'canvas_bg') {
            console.log('yo!');
            this.selectedPathElement = undefined;
        }
    }
}
