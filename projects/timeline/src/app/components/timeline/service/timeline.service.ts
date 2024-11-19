import { Injectable } from '@angular/core';
import { Keyframe, Timeline, Track } from '../model/timeline.model';
import { Subject } from 'rxjs';
import gsap from 'gsap';
import { Animateable } from '../model/timeline.model';

@Injectable({
    providedIn: 'root',
})
export class TimelineService {
    timeline: Timeline;
    tweens: any[] = [];

    gsapTimeline: gsap.core.Timeline = gsap.timeline({
        repeat: 0,
        repeatDelay: 0,
        onUpdate: () => {
            // in seconds
            this.updatePosition(this.gsapTimeline.time() * 1000);
        },
    });

    updated$: Subject<Timeline> = new Subject<Timeline>();
    positionUpdated$: Subject<number> = new Subject<number>();
    constructor() {
        this.timeline = {
            groups: [],
            pixelsPerMilliseconds: 0.1,
            duration: 3000 * 1000,
            position: 0,
        };
    }

    updatePosition(p: number) {
        this.timeline.position = p;
        this.positionUpdated$.next(p);
        this.gsapTimeline?.seek(p / 1000);
    }

    keyframePositionChanged(p: number, keyframe: Keyframe) {
        keyframe.time = p;
        this.updated();
    }

    addGroup(group: Animateable) {
        this.timeline.groups.push(group);
        this.updated();
    }

    updated() {
        this.updated$.next(this.timeline);
        this.calculateTweens();
    }

    calculateTweens() {
        this.gsapTimeline.clear();
        this.tweens = [];

        this.timeline.groups.forEach((group) => {
            group.tracks.forEach((track) => {
                track.tweens = [];
                track.keyframes.forEach((keyframe, index) => {
                    const nextKeyframe = track.keyframes[index + 1];
                    if (nextKeyframe) {
                        console.log('set ', track.name, keyframe.value);
                        console.log('set next ', track.name, nextKeyframe.value);

                        let fromVars: any;
                        let toVars: any;
                        if (track.name === 'position') {
                            fromVars = keyframe.value
                            toVars = {...nextKeyframe.value, duration: (nextKeyframe.time - keyframe.time) / 1000}

                        } else {
                            fromVars = {
                                [track.name]: keyframe.value,
                            };
                            toVars = {
                                [track.name]: nextKeyframe.value,
                                duration: (nextKeyframe.time - keyframe.time) / 1000,
                            };
                        }

                        if (!keyframe.easing || keyframe.easing === 'default') {
                        } else {
                            toVars.ease = keyframe.easing;
                        }

                        track.tweens.push({
                            start: keyframe,
                            end: nextKeyframe,
                        });

                        this.gsapTimeline.fromTo(group.animationTarget, fromVars, toVars, keyframe.time / 1000);
                    } else {
                        const props: any = {
                            [track.name]: keyframe.value,
                        };
                        this.gsapTimeline.set(group.animationTarget, props, keyframe.time);
                    }
                });
            });
        });

        this.gsapTimeline.pause();
        this.gsapTimeline.seek(this.timeline.position / 1000);
    }

    removeKeyframe(data: { keyframe: Keyframe; track: Track; group: Animateable }) {
        data.track.keyframes = data.track.keyframes.filter((k) => k !== data.keyframe);
        this.updated();
    }
}
