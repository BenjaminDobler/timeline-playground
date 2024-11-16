import { Injectable, inject } from '@angular/core';
import { TimelineService } from './timeline.service';
import gsap from 'gsap';
import { Group } from '../model/timeline.model';
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
            console.log('dragging', x, y);
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

    selectedGroup: Group | null = null;

    timelineService: TimelineService = inject(TimelineService);

    gsapTimeline: gsap.core.Timeline | null = null;

    selectedProperties: any = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
    };

    tl: gsap.core.Timeline = gsap.timeline({
        repeat: 0,
        repeatDelay: 0,
        onUpdate: () => {
            console.log('on Update');
        },
    });

    constructor() {


        this.timelineService.updated$.subscribe((timeline) => {
            this.tl.clear();
            console.log('updated!!!!!');
            
            timeline.groups.forEach((group) => {
                group.tracks.forEach((track) => {
                    track.keyframes.forEach((keyframe, index) => {
                        const nextKeyframe = track.keyframes[index + 1];
                        if (nextKeyframe) {
                            const prop: any = {};

                            const fromVars = {
                                [track.name]: keyframe.value,
                            };
                            const toVars = {
                                [track.name]: nextKeyframe.value,
                                duration: (nextKeyframe.time - keyframe.time) / 1000,
                            };

                            this.tl.fromTo(group.target, fromVars, toVars, keyframe.time / 1000);
                            console.log('FROM TO ', keyframe.time / 1000, toVars.duration);
                            

                            // tl.to(group.target, prop, keyframe.time / 1000);
                            console.log(prop, keyframe.time / 1000, prop.duration);
                        } else {
                            const props: any = {
                                [track.name]: keyframe.value,
                            };
                            this.tl.set(group.target, props, keyframe.time);
                        }
                    });
                });
            });

            console.log('play ', this.tl);

            this.tl.pause();
            this.gsapTimeline = this.tl;

            this.timelineService.positionUpdated$.subscribe((position) => {
                this.gsapTimeline?.seek(position / 1000);
                this.syncGroupAndHighlight();
            });
        });
    }

    addRectangle() {
        const newDiv = document.createElement('div');
        newDiv.style.width = '200px';
        newDiv.style.height = '200px';
        newDiv.style.position = 'absolute';
        newDiv.style.left = '0px';
        newDiv.style.top = '0px';
        newDiv.style.backgroundColor = 'red';

        let newGroup: Partial<Group> = {
            name: 'New Group',
            expanded: true,
            target: newDiv,
        };
        if (this.canvas !== null) {
            this.canvas.appendChild(newDiv);
            //document.body.insertBefore(this.canvas, newDiv);
        }

        const { dragging, dragend } = drag(newDiv, this.canvas as HTMLElement);

        fromEvent(newDiv, 'mousedown').subscribe(() => {
            this.setSelectedGroup(newGroup as Group);
        });
        dragging.subscribe((props) => {
            console.log('dragging');

            this.propertyChanged('x', props.x, false);
            this.propertyChanged('y', props.y, false);
        });

        dragend.subscribe(() => {
            this.updateTimeline();
        });

        newGroup.tracks = [
            {
                keyframes: [
                    { time: 0, value: 0 },
                    // { time: 22000, value: 200 },
                    // { time: 26000, value: 200 },
                    // { time: 34000, value: 0 },
                ],
                name: 'x',
            },
            {
                keyframes: [
                    { time: 0, value: 0 },
                    // { time: 22000, value: 200 },
                ],
                name: 'y',
            },
        ];
        this.timelineService.addGroup(newGroup as Group);
        this.timelineService.updated();
        this.selectedGroup = newGroup as Group;
    }

    propertyChanged(prop: string, value: number, updateTimeline = true) {
        console.log('propertyChanged', prop, value);
        if (this.selectedGroup) {
            let track = this.selectedGroup.tracks.find((track) => track.name === prop);
            if (!track) {
                track = {
                    name: prop,
                    keyframes: [],
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

            if (this.highlight) {
                this.highlight.style.transform = `translate(${this.selectedProperties.x - 5}px,${this.selectedProperties.y - 5}px)`;
                this.highlight.style.height = this.selectedProperties.height + 10 + 'px';
                this.highlight.style.width = this.selectedProperties.width + 10 + 'px';
            }
        }
    }

    setSelectedGroup(group: Group) {
        this.selectedGroup = group;
        this.syncGroupAndHighlight();
        // this.updateTimeline();

    }

    syncGroupAndHighlight() {
        if (this.selectedGroup) {
            this.selectedProperties.x = gsap.getProperty(this.selectedGroup.target, 'x');
            this.selectedProperties.y = gsap.getProperty(this.selectedGroup.target, 'y');
            this.selectedProperties.width = gsap.getProperty(this.selectedGroup.target, 'width');
            this.selectedProperties.height = gsap.getProperty(this.selectedGroup.target, 'height');
            this.selectedProperties.rotation = gsap.getProperty(this.selectedGroup.target, 'rotation');

            if (this.highlight) {
                this.highlight.style.transform = `translate(${this.selectedProperties.x - 5}px,${this.selectedProperties.y - 5}px)`;
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
