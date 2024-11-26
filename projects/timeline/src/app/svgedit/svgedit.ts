import { filter, finalize, fromEvent, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Point } from './point';
import { bringToTopofSVG, distance, getAngle, insertAt, isInWhichSegment } from './util';

export class SVGEdit {
    points: Point[] = [];
    private _svg?: SVGElement | undefined;

    onNewPathAdded?: (path: SVGPathElement)=>void;

    private _d: string = '';
    public get d(): string {
        return this._d;
    }
    public set d(value: string) {
        if(value !== this._d && this.onPathChanged && this.selectedPathElement) {
            this.onPathChanged(value, this.selectedPathElement);
        }
        this._d = value;
    }

    onPathChanged?: (d: string, path: SVGPathElement)=>void;

    private controlLinesPath?: SVGPathElement;

    public get svg(): SVGElement | undefined {
        return this._svg;
    }
    public set svg(value: SVGElement | undefined) {
        this._svg = value;

        if (this._svg) {
            const controlLines = this.svg?.querySelector('.control_lines');
            if (!this.svg?.querySelector('.editorControls')) {
                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.classList.add('editorControls');

                const controlLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                this.controlLinesPath = controlLines;
                controlLines.classList.add('control_lines');
                group.appendChild(controlLines);

                this.svg?.appendChild(group);
            } else {
                if (controlLines) {
                    this.controlLinesPath = controlLines as SVGPathElement;
                }
            }
            fromEvent(this.svg as any, 'mousedown').subscribe((evt) => {
                this.onCanvas(evt);
            });
        }
    }
    dragging = false;
    mode$ = new Subject<string>();
    mode = 'select';
    connectionD = '';

    isOverLine = false;
    isOverPoint = false;

    isCurveDragging = false;

    keyAltDown = false;
    keyMetaDown = false;

    private _selectedPathElement?: SVGPathElement | undefined;
    public get selectedPathElement(): SVGPathElement | undefined {
        return this._selectedPathElement;
    }
    public set selectedPathElement(value: SVGPathElement | undefined) {
        if (value !== this._selectedPathElement && value) {
            this.generatePointsFromPath(value);
            this.selectedPathElement$.next(value);
            const editorGroup = this.svg?.querySelector('.editorControls') as SVGElement;
            if (editorGroup) {
                bringToTopofSVG(editorGroup);
            }
        } else if (!value) {
            this.points.forEach((p) => {
                p.destroy();
            });
            this.points = [];
        }

        this._selectedPathElement = value;
        this.draw();
    }

    selectedPathElement$: Subject<SVGPathElement> = new Subject<SVGPathElement>();

    constructor() {}

    init() {
        this.initKeyboard();
        this.initMouseGuestures();
    }

    initKeyboard() {
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
    }

    initMouseGuestures() {
        const mouseDown$ = fromEvent<MouseEvent>(window, 'mousedown');
        const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
        const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');

        let moves = 0;
        let downPoint: Point;
        let parentRect = { left: 0, top: 0 };
        if (this.svg) {
            parentRect = this.svg.getBoundingClientRect();
        }

        mouseMove$.pipe(filter((x) => !this.dragging)).subscribe((evt: MouseEvent) => {
            if (this.mode === 'pen') {
                this.draw({ x: evt.clientX - parentRect.left, y: evt.clientY - parentRect.top });
            }
        });

        mouseDown$
            .pipe(
                filter((x: any) => {
                    return this.mode === 'pen' && !x.target.classList.contains('point');
                }),
                tap((downEvent: MouseEvent) => {
                    moves = 0;
                    downPoint = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this));
                    downPoint.x = downEvent.clientX - parentRect.left;
                    downPoint.y = downEvent.clientY - parentRect.top;

                    this.points.push(downPoint);
                    this.draw();
                }),
                switchMap(() => {
                    return mouseMove$.pipe(
                        tap((dragMoveEvent) => {
                            if (moves === 3) {
                                const previousPoint = this.points[this.points.length - 2];
                                if (!previousPoint.controlPoint1) {
                                    previousPoint.controlPoint2 = new Point(
                                        this.svg,
                                        'control',
                                        () => this.draw(),
                                        this.positionUpdated.bind(this),
                                    );
                                    previousPoint.controlPoint2.x = previousPoint.x;
                                    previousPoint.controlPoint2.y = previousPoint.y;
                                }

                                const controlPoint1 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this));
                                controlPoint1.x = downPoint.x;
                                controlPoint1.y = downPoint.y;
                                controlPoint1.centerPoint = downPoint;

                                const controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this));
                                controlPoint2.x = downPoint.x;
                                controlPoint2.y = downPoint.y;
                                controlPoint2.centerPoint = downPoint;
                                controlPoint2.opposite = controlPoint1;

                                controlPoint1.opposite = controlPoint2;
                                downPoint.controlPoint1 = controlPoint1;
                                downPoint.controlPoint2 = controlPoint2;
                            } else if (moves > 3) {
                                this.dragging = true;
                                if (downPoint.controlPoint1) {
                                    const diffX = dragMoveEvent.clientX - parentRect.left - downPoint.x;
                                    const diffY = dragMoveEvent.clientY - parentRect.top - downPoint.y;

                                    downPoint.controlPoint1.x = downPoint.x + -1 * diffX;
                                    downPoint.controlPoint1.y = downPoint.y + -1 * diffY;
                                }

                                if (downPoint.controlPoint2) {
                                    downPoint.controlPoint2.x = dragMoveEvent.clientX - parentRect.left;
                                    downPoint.controlPoint2.y = dragMoveEvent.clientY - parentRect.top;
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

    draw(movePoint?: { x: number; y: number }) {
        if (this.points.length > 0 && !this.selectedPathElement) {
            if (this.svg) {
                const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                newPath.setAttribute('fill', 'none');
                newPath.setAttribute('stroke', '#fff');
                if (this.points.length > 0) {
                    newPath.setAttribute('d', `M${(this.points[0].x, this.points[0].y)}`);
                }

                fromEvent(newPath, 'mousedown').subscribe(($event) => {
                    this.onPathClick($event);
                });

                fromEvent(newPath, 'mouseover').subscribe(($event) => {
                    this.mouseOverPath($event);
                });

                fromEvent(newPath, 'mouseout').subscribe(($event) => {
                    this.mouseOutPath($event);
                });

                this.svg.appendChild(newPath);
                if (this.onNewPathAdded) {
                    this.onNewPathAdded(newPath);
                }

                const pointsBefore = [...this.points];
                this.selectedPathElement = newPath;
                this.points = pointsBefore;
            }
        }
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

        if (this.controlLinesPath) {
            this.controlLinesPath.setAttribute('d', connectionD);
        }
        if (this.selectedPathElement) {
            this.selectedPathElement.setAttribute('d', d);
        }

        this.d = d;
    }

    generatePointsFromPath(path: SVGPathElement) {
        const segments = (path as any).getPathData();

        const points: Point[] = [];

        segments.forEach((seg: any, index: number) => {
            const previousPoint = points[points.length - 1];
            if (seg.type === 'M') {
                const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this));
                p.x = seg.values[0];
                p.y = seg.values[1];
                points.push(p);
            }
            if (seg.type === 'L') {
                const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this));
                p.x = seg.values[0];
                p.y = seg.values[1];
                points.push(p);
            }
            if (seg.type === 'C') {
                const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this));
                p.x = seg.values[4];
                p.y = seg.values[5];

                const controlPoint1 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this));

                controlPoint1.x = seg.values[0];
                controlPoint1.y = seg.values[1];
                controlPoint1.centerPoint = previousPoint;

                const controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this));
                controlPoint2.x = seg.values[2];
                controlPoint2.y = seg.values[3];
                controlPoint2.centerPoint = p;

                p.controlPoint1 = controlPoint2;
                previousPoint.controlPoint2 = controlPoint1;

                if (previousPoint.controlPoint1 && previousPoint.controlPoint2) {
                    previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
                    previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
                }

                points.push(p);
            }
        });

        this.points = points;

        // this.draw();
    }

    onPathClick(evt: any) {
        if (this.selectedPathElement !== evt.target) {
            this.selectedPathElement = evt.target;
            return;
        }

        let parentRect = { left: 0, top: 0 };
        if (this.svg) {
            parentRect = this.svg.getBoundingClientRect();
        }
        const segIndex = isInWhichSegment(evt.target, evt.clientX - parentRect.left, evt.clientY - parentRect.top);
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
                                const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this));
                                p.x = evt.clientX - parentRect.left;
                                p.y = evt.clientY - parentRect.top;
                                this.points = insertAt(this.points, pointIndex, p);
                            }
                            this.isCurveDragging = false;
                        }),
                    )
                    .subscribe((evt: MouseEvent) => {
                        moveCount++;

                        const mousePoint = {
                            x: evt.clientX - parentRect.left,
                            y: evt.clientY - parentRect.top,
                        };

                        if (moveCount > 3) {
                            // Convert line to curve

                            if (!previousPoint.controlPoint2) {
                                previousPoint.controlPoint2 = new Point(
                                    this.svg,
                                    'curve',
                                    () => this.draw(),
                                    this.positionUpdated.bind(this),
                                );
                                previousPoint.centerPoint = previousPoint;

                                if (previousPoint.controlPoint1) {
                                    previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
                                    previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
                                }
                            }

                            if (!p.controlPoint1) {
                                p.controlPoint1 = new Point(this.svg, 'curve', () => this.draw(), this.positionUpdated.bind(this));
                                p.controlPoint1.centerPoint = p;
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
        let parentRect = { left: 0, top: 0 };
        if (this.svg) {
            parentRect = this.svg.getBoundingClientRect();
        }
        const segIndex = isInWhichSegment(evt.target, evt.clientX - parentRect.left, evt.clientY - parentRect.top);
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
        if (this.mode === 'select' && (evt.target === this.svg || evt.target.getAttribute('id') === 'canvas_bg')) {
            this.selectedPathElement = undefined;
        }
    }

    positionUpdated(point: Point, diffX: number, diffY: number) {
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
}
