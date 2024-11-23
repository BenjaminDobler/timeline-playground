import { Injectable, inject, signal } from '@angular/core';
import { TimelineService } from './timeline.service';
import gsap from 'gsap';
import { Animateable, Keyframe, PathAnimatable, Rectangle, TextDiv, Track } from '../model/timeline.model';
import { Subject, fromEvent, map, switchMap, takeUntil, tap } from 'rxjs';
import { TimelineCanvasComponent } from '../../timeline-canvas/timeline-canvas.component';

function drag(target: HTMLElement, parentElement: HTMLElement) {
    const dragging = new Subject<any>();
    const dragend = new Subject<void>();
    let parentRect = parentElement.getBoundingClientRect();
    const mousedown$ = fromEvent<MouseEvent>(target, 'mousedown');
    const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');
    const drag$ = mousedown$.pipe(
        switchMap((mouseDownEvent) => {
            parentRect = parentElement.getBoundingClientRect();
            return mousemove$.pipe(
                map((mouseMoveEvent) => {
                    return {
                        left: mouseMoveEvent.clientX - mouseDownEvent.offsetX,
                        top: mouseMoveEvent.clientY - mouseDownEvent.offsetY,
                    };
                }),
                takeUntil(
                    mouseup$.pipe(
                        tap(() => {
                            dragend.next();
                        }),
                    ),
                ),
            );
        }),
    );

    drag$.subscribe(({ left, top }) => {
        // target.style.left = left + 'px';
        // target.style.top = top + 'px';
        if (parentRect) {
            let x = left - parentRect.left;
            let y = top - parentRect.top;

            x = Math.max(0, x);
            y = Math.max(0, y);
            target.style.transform = `translate(${x}px, ${y}px)`;
            dragging.next({ x, y });
        }
    });

    return {
        dragging,
        dragend,
    };
}

@Injectable({
    providedIn: 'root',
})
export class CoordinationService {
    highlight?: HTMLDivElement;

    selectedGroup?: Animateable;

    timelineService: TimelineService = inject(TimelineService);

    gsapTimeline: gsap.core.Timeline | null = null;

    selectedProperties: any = signal({
        x: signal(0),
        y: signal(0),
        position: signal({
            x: 0,
            y: 0,
        }),
        width: signal(0),
        height: signal(0),
        rotation: signal(9),
        background: signal('#ff0000'),
        borderRadius: signal(0),
        d: signal('')
    });

    constructor() {
        this.timelineService.positionUpdated$.subscribe((position) => {
            this.syncGroupAndHighlight();
        });
    }

    htmlCanvas?: HTMLDivElement;
    svgCanvas?: SVGElement;

    setCanvas(canvas: TimelineCanvasComponent) {
        this.highlight = canvas.highlight()?.nativeElement;
        this.htmlCanvas = canvas.htmlElements()?.nativeElement;
        this.svgCanvas = canvas.svgElements()?.nativeElement;
    }

    addText() {
        const newDiv = document.createElement('div');
        newDiv.style.position = 'absolute';
        newDiv.style.left = '0px';
        newDiv.style.top = '0px';
        newDiv.innerText = 'Some text...';
        newDiv.contentEditable = 'true';

        const animateable = new TextDiv(newDiv, newDiv);
        this.addElement(animateable);
        // this.addElement(newDiv, 'Text');
    }

    addPath() {
        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        iconSvg.setAttribute('width', '800');
        iconSvg.setAttribute('height', '800');

        // iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.setAttribute('stroke', 'black');

        iconPath.setAttribute('d', 'M 310 125 C 310 125 484 202 484 202 L 410 390 L 124 399 C 124 399 13 246 95 186 Z');

        iconSvg.appendChild(iconPath);
        const animatable = new PathAnimatable(iconPath, iconPath as any);
        this.addElement(animatable);
    }

    addRectangle() {
        const newDiv = document.createElement('div');
        newDiv.style.width = '200px';
        newDiv.style.height = '200px';
        newDiv.style.position = 'absolute';
        newDiv.style.left = '0px';
        newDiv.style.top = '0px';
        newDiv.style.backgroundColor = 'red';

        const animateable = new Rectangle(newDiv, newDiv);

        this.addElement(animateable);
    }

    addElement(animateable: Animateable) {
        if (this.htmlCanvas && !animateable.isSvg) {
            this.htmlCanvas.appendChild(animateable.domRef);
            //document.body.insertBefore(this.canvas, newDiv);
        } else if (this.svgCanvas && animateable.isSvg) {
            this.svgCanvas.appendChild(animateable.domRef);
        }

        const { dragging, dragend } = drag(animateable.domRef, this.htmlCanvas as HTMLElement);

        fromEvent(animateable.domRef, 'mousedown').subscribe(() => {
            this.setSelectedGroup(animateable);
        });
        dragging.subscribe((props) => {
            this.propertyChanged('position', { x: props.x, y: props.y }, false);
        });

        dragend.subscribe(() => {
            this.updateTimeline();
        });

        animateable.tracks.set([
            {
                keyframes: signal([
                    {
                        time: signal(0),
                        value: signal({
                            x: 0,
                            y: 0,
                        }),
                        easing: signal('default'),
                    },
                ]),
                name: 'position',
                tweens: signal([]),
            },
        ]);
        this.timelineService.addGroup(animateable);
        this.timelineService.updated();
        this.setSelectedGroup(animateable);
    }

    propertyChanged(prop: string, value: any, updateTimeline = true) {
        const selectedProperties = this.selectedProperties();
        if (this.selectedGroup) {
            let trackName = prop;
            let track = this.selectedGroup.tracks().find((track) => track.name === prop);
            if (!track) {
                track = {
                    name: prop,
                    keyframes: signal([]),
                    tweens: signal([]),
                };
                this.selectedGroup.tracks.update((t) => [...t, track as Track]);
            }
            const existingKeyframe = track?.keyframes().find((keyframe) => keyframe.time() === this.timelineService.position());

            if (existingKeyframe) {
                existingKeyframe.value = value;
            } else {
                const newKeyframe = {
                    time: signal(this.timelineService.position()),
                    value: signal(value),
                    easing: signal('default'),
                };
                if (track) {
                    track.keyframes.update((k) => [...k, newKeyframe as unknown as Keyframe]);
                }
            }
            track?.keyframes().sort((a, b) => a.time() - b.time());
            if (updateTimeline) {
                this.updateTimeline();
            }
        }

        if (this.selectedGroup) {
            if (selectedProperties[prop]) {
                selectedProperties[prop].set(value);
            } else {
                selectedProperties[prop] = signal(value);
            }

            if (this.highlight) {
                this.highlight.style.transform = `translate(${selectedProperties.position().x - 5}px,${selectedProperties.position().y - 5}px)`;
                this.highlight.style.height = selectedProperties.height() + 10 + 'px';
                this.highlight.style.width = selectedProperties.width() + 10 + 'px';
            }
        }
    }

    setSelectedGroup(group: Animateable) {
        console.log('select group ', group);
        this.selectedGroup = group;
        this.syncGroupAndHighlight();
        // this.updateTimeline();
    }

    syncGroupAndHighlight() {
        let selectedProperties = this.selectedProperties();
        if (this.selectedGroup) {
            this.selectedProperties().position.set({
                x: gsap.getProperty(this.selectedGroup.animationTarget, 'x'),
                y: gsap.getProperty(this.selectedGroup.animationTarget, 'y'),
            });

            selectedProperties = this.selectedProperties();

            selectedProperties.width.set(gsap.getProperty(this.selectedGroup.animationTarget, 'width'));
            selectedProperties.height.set(gsap.getProperty(this.selectedGroup.animationTarget, 'height'));
            selectedProperties.rotation.set(gsap.getProperty(this.selectedGroup.animationTarget, 'rotation'));

            this.selectedGroup.properties.forEach((p) => {
                if (this.selectedGroup) {                    
                    selectedProperties[p.name].set(gsap.getProperty(this.selectedGroup.animationTarget, p.name));
                }
            });

            if (this.highlight) {
                console.log(selectedProperties.width());
                this.highlight.style.transform = `translate(${selectedProperties.position().x - 5}px,${this.selectedProperties().position().y - 5}px)`;
                this.highlight.style.height = selectedProperties.height() + 10 + 'px';
                this.highlight.style.width = selectedProperties.width() + 10 + 'px';
            }
        }
    }

    updateTimeline() {
        this.timelineService.updated();
        this.gsapTimeline?.seek(this.timelineService.position() / 1000);
    }
}
