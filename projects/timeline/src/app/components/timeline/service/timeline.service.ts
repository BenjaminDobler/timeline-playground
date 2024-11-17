import { Injectable } from '@angular/core';
import { Group, Keyframe, Timeline, Track } from '../model/timeline.model';
import { Subject } from 'rxjs';
import gsap from 'gsap';

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

    addGroup(group: Group) {
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

                        const fromVars = {
                            [track.name]: keyframe.value,
                        };
                        const toVars: any = {
                            [track.name]: nextKeyframe.value,
                            duration: (nextKeyframe.time - keyframe.time) / 1000,
                        };

                        if (!keyframe.easing || keyframe.easing === 'default') {
                        } else {
                            toVars.ease = keyframe.easing;
                        }

                        track.tweens.push({
                            start: keyframe,
                            end: nextKeyframe,
                        });

                        this.gsapTimeline.fromTo(group.target, fromVars, toVars, keyframe.time / 1000);
                    } else {
                        const props: any = {
                            [track.name]: keyframe.value,
                        };
                        this.gsapTimeline.set(group.target, props, keyframe.time);
                    }
                });
            });
        });

        this.gsapTimeline.pause();
        this.gsapTimeline.seek(this.timeline.position / 1000);
    }

    removeKeyframe(data: { keyframe: Keyframe; track: Track; group: Group }) {
        data.track.keyframes = data.track.keyframes.filter((k) => k !== data.keyframe);
        this.updated();
    }
}
