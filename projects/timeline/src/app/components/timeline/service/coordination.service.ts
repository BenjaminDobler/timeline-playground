import { Injectable, inject } from '@angular/core';
import { TimelineService } from './timeline.service';
import gsap from 'gsap';
import { Animateable, Rectangle, TextDiv } from '../model/timeline.model';
import { Subject, fromEvent, map, switchMap, takeUntil, tap } from 'rxjs';

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
    canvas: HTMLDivElement | null = null;
    highlight?: HTMLDivElement;

    selectedGroup?: Animateable;

    timelineService: TimelineService = inject(TimelineService);

    gsapTimeline: gsap.core.Timeline | null = null;

    selectedProperties: any = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        background: '#ff0000',
    };

    constructor() {
        this.timelineService.positionUpdated$.subscribe((position) => {
            this.syncGroupAndHighlight();
        });
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
        if (this.canvas !== null) {
            this.canvas.appendChild(animateable.domRef);
            //document.body.insertBefore(this.canvas, newDiv);
        }

        const { dragging, dragend } = drag(animateable.domRef, this.canvas as HTMLElement);

        fromEvent(animateable.domRef, 'mousedown').subscribe(() => {
            this.setSelectedGroup(animateable);
        });
        dragging.subscribe((props) => {
            // this.propertyChanged('x', props.x, false);
            // this.propertyChanged('y', props.y, false);
            this.propertyChanged('position', {x: props.x, y: props.y}, false);
        });

        dragend.subscribe(() => {
            this.updateTimeline();
        });

        animateable.tracks = [
            {
                keyframes: [
                    { time: 0, value: {
                        x: 0,
                        y: 0
                    } },
                    // { time: 22000, value: 200 },
                    // { time: 26000, value: 200 },
                    // { time: 34000, value: 0 },
                ],
                name: 'position',
                tweens: [],
            }
        ];
        this.timelineService.addGroup(animateable);
        this.timelineService.updated();
        this.setSelectedGroup(animateable);
    }

    propertyChanged(prop: string, value: any, updateTimeline = true) {
        if (this.selectedGroup) {
            let trackName = prop;
            let track = this.selectedGroup.tracks.find((track) => track.name === prop);
            if (!track) {
                track = {
                    name: prop,
                    keyframes: [],
                    tweens: [],
                };
                this.selectedGroup.tracks.push(track);
            }
            const existingKeyframe = track?.keyframes.find((keyframe) => keyframe.time === this.timelineService.timeline.position);

            if (existingKeyframe) {
                existingKeyframe.value = value;
            } else {
                const newKeyframe = {
                    time: this.timelineService.timeline.position,
                    value: value,
                };
                if (track) {
                    track.keyframes.push(newKeyframe);
                }
            }
            track?.keyframes.sort((a, b) => a.time - b.time);
            if (updateTimeline) {
                this.updateTimeline();
            }
        }

        if (this.selectedGroup) {
            this.selectedProperties[prop] = value;

            console.log('selected properties ', this.selectedProperties);

            if (this.highlight) {
                this.highlight.style.transform = `translate(${this.selectedProperties.position.x - 5}px,${this.selectedProperties.position.y - 5}px)`;
                this.highlight.style.height = this.selectedProperties.height + 10 + 'px';
                this.highlight.style.width = this.selectedProperties.width + 10 + 'px';
            }
        }
    }

    setSelectedGroup(group: Animateable) {
        this.selectedGroup = group;
        this.syncGroupAndHighlight();
        // this.updateTimeline();
    }

    syncGroupAndHighlight() {
        if (this.selectedGroup) {
            // this.selectedProperties.x = gsap.getProperty(this.selectedGroup.animationTarget, 'x');
            // this.selectedProperties.y = gsap.getProperty(this.selectedGroup.animationTarget, 'y');
            this.selectedProperties.position = {
                x: gsap.getProperty(this.selectedGroup.animationTarget, 'x'),
                y: gsap.getProperty(this.selectedGroup.animationTarget, 'y')
            }
            this.selectedProperties.width = gsap.getProperty(this.selectedGroup.animationTarget, 'width');
            this.selectedProperties.height = gsap.getProperty(this.selectedGroup.animationTarget, 'height');
            this.selectedProperties.rotation = gsap.getProperty(this.selectedGroup.animationTarget, 'rotation');

            if (this.highlight) {
                this.highlight.style.transform = `translate(${this.selectedProperties.position.x - 5}px,${this.selectedProperties.position.y - 5}px)`;
                this.highlight.style.height = this.selectedProperties.height + 10 + 'px';
                this.highlight.style.width = this.selectedProperties.width + 10 + 'px';
            }
        }
    }

    updateTimeline() {
        this.timelineService.updated();
        this.gsapTimeline?.seek(this.timelineService.timeline.position / 1000);
    }
}
