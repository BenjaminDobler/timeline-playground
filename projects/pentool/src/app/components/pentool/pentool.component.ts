import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fromEvent, takeUntil } from 'rxjs';

export interface Path {
    name: string;
    d: string;
    parts: any[];
    color: string;
    strokeWidth: string;
    totalLength: number;
    strokeDashArrayOffset: number;
    strokeDashArray: number;

}

@Component({
    selector: 'pentool',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pentool.component.html',
    styleUrl: './pentool.component.scss',
})
export class PentoolComponent {
    mode: 'pen' | 'select' | 'edit' = 'pen';
    controlLines = '';
    lastPart: any;

    selectedPath: Path | null = null;
    paths: Path[] = [];

    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        fromEvent(window, 'keydown').subscribe((event: any) => {
            console.log('key down', event);
            if (event.code === 'Escape') {
                this.selectedPath = null;
                this.updatePath();
            }
            // if (event.key === 'p') {
            //     this.mode = 'pen';
            // } else if (event.key === 's') {
            //     this.mode = 'select';
            // }
        });
    }

    mouseDown = false;
    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (event.clientX > 800 || event.clientY > 800) {
            return;
        }
        console.log('event ', event);
        if (this.mode === 'pen') {
            const part = {
                x: event.clientX,
                y: event.clientY,
            };
            this.lastPart = part;
            this.selectedPath?.parts.push(part);
            this.mouseDown = true;
            this.updatePath();
        }
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (event.clientX > 800 || event.clientY > 800) {
            return;
        }
        if (this.mouseDown) {
            console.log('yes mouse donw ', event.offsetX, event.clientX);
            if (this.lastPart && !this.lastPart.handle) {
                const handle = {
                    x: this.lastPart.x,
                    y: this.lastPart.y,
                };
                const handle2 = {
                    x: this.lastPart.x,
                    y: this.lastPart.y,
                };
                this.lastPart.handle = handle;
                this.lastPart.handle2 = handle2;
            } else {
                this.lastPart.handle.x = event.clientX;
                this.lastPart.handle.y = event.clientY;

                const diffX = this.lastPart.handle.x - this.lastPart.x;
                const diffY = this.lastPart.handle.y - this.lastPart.y;

                this.lastPart.handle2.x = this.lastPart.x + -1 * diffX;
                this.lastPart.handle2.y = this.lastPart.y + -1 * diffY;
            }
            this.updatePath();
        } else {
            if (this.mode === 'pen') {
                this.updatePath({ x: event.clientX, y: event.clientY });
            }
        }
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (event.clientX > 800 || event.clientY > 800) {
            return;
        }
        this.mouseDown = false;
        this.lastPart = null;
    }

    updatePath(endPart?: any) {
        let p = '';
        this.controlLines = '';
        const parts = this.selectedPath?.parts;
        if (parts) {
            parts.forEach((part: any, i) => {
                if (part.type === 'close') {
                    p += 'Z';
                } else if (i === 0) {
                    p += `M ${part.x} ${part.y} `;
                } else if (!part.handle) {
                    p += `L ${part.x} ${part.y} `;
                } else {
                    const prev: any = parts[i - 1];
                    p += `C ${prev.x} ${prev.y}, ${part.handle2.x} ${part.handle2.y}, ${part.x} ${part.y} `;
                }

                if (part.handle) {
                    this.controlLines += `M ${part.handle.x} ${part.handle.y} L ${part.handle2.x} ${part.handle2.y}`;
                }
            });

            if (endPart) {
                if (parts.length > 0) {
                    p += `L ${endPart.x} ${endPart.y} `;
                } else {
                    p += `M ${endPart.x} ${endPart.y} `;
                }
            }
        }

        // this.path = p;
        if (!this.selectedPath) {
            // this.selectedPathIndex = this.paths.length;
            // this.paths.push(p);

            const newPath: Path = {
                name: 'Path' + this.paths.length,
                d: p,
                parts: [],
                color: '#000000',
                strokeWidth: '5px',
                totalLength: 0,
                strokeDashArray: 0,
                strokeDashArrayOffset: 0
            };
            this.paths.push(newPath);
            this.selectedPath = newPath;
        } else if (this.selectedPath) {
            this.selectedPath.d = p;
        }
    }

    onPart(part: any, event: MouseEvent) {
        event.stopPropagation();
        console.log('on part');

        if (this.mode === 'pen') {
            this.selectedPath?.parts.push({
                x: event.clientX,
                y: event.clientY,
                type: 'close',
            });
            this.updatePath();

            this.selectedPath = null;
            this.updatePath();
        }

        // console.log('on part');
        // this.path = this.path +=" Z";
        // this.mode = 'select';

        if (this.mode === 'edit') {
            let last = { x: event.clientX, y: event.clientY };
            fromEvent(window, 'mousemove')
                .pipe(takeUntil(fromEvent(window, 'mouseup')))
                .subscribe((event: any) => {
                    part.x = event.clientX;
                    part.y = event.clientY;
                    if (part.handle) {
                        part.handle.x += event.clientX - last.x;
                        part.handle.y += event.clientY - last.y;
                    }

                    if (part.handle2) {
                        part.handle2.x += event.clientX - last.x;
                        part.handle2.y += event.clientY - last.y;
                    }
                    this.updatePath();
                    last = { x: event.clientX, y: event.clientY };
                });
        }
    }

    onHandle2(part: any, event: MouseEvent) {
        event.stopPropagation();

        fromEvent(window, 'mousemove')
            .pipe(takeUntil(fromEvent(window, 'mouseup')))
            .subscribe((event: any) => {
                part.handle2.x = event.clientX;
                part.handle2.y = event.clientY;

                const diffX = part.handle2.x - part.x;
                const diffY = part.handle2.y - part.y;

                part.handle.x = part.x + -1 * diffX;
                part.handle.y = part.y + -1 * diffY;
                this.updatePath();
            });
    }

    onHandle1(part: any, event: MouseEvent) {
        event.stopPropagation();
        fromEvent(window, 'mousemove')
            .pipe(takeUntil(fromEvent(window, 'mouseup')))
            .subscribe((event: any) => {
                part.handle.x = event.clientX;
                part.handle.y = event.clientY;

                const diffX = part.handle.x - part.x;
                const diffY = part.handle.y - part.y;

                part.handle2.x = part.x + -1 * diffX;
                part.handle2.y = part.y + -1 * diffY;
                this.updatePath();
            });
    }

    onPath(path: Path) {
        console.log('on path');
        // mouseEvent.stopPropagation();
        if (this.mode === 'select') {
            this.selectedPath = path;
            this.mode = 'edit';
            this.updatePath();
        }
    }

    selectPath(p: Path) {
        this.selectedPath = p;
        this.updatePath();
    }

    calculatePathLength(path: Path) {
        const pathElement = (document.getElementById('path'+this.paths.indexOf(path)) as unknown) as SVGPathElement;
       // pathElement.getTotalLength(); // 988.0062255859375
        path.totalLength = pathElement.getTotalLength();
        path.strokeDashArray = path.totalLength;
    }
}
