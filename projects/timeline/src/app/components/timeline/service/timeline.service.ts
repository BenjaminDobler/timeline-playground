import { Injectable, signal, Signal } from '@angular/core';
import { Keyframe, Track, Tween } from '../model/timeline.model';
import { Subject } from 'rxjs';
import gsap from 'gsap';
import { Animateable } from '../model/timeline.model';

@Injectable({
    providedIn: 'root',
})
export class TimelineService {
    tweens: any[] = [];

    groups = signal<Animateable[]>([]);
    pixelsPerMilliseconds = signal<number>(0.1);
    duration = signal(3000 * 1000);
    position = signal(0);

    gsapTimeline: gsap.core.Timeline = gsap.timeline({
        repeat: 0,
        repeatDelay: 0,
        onUpdate: () => {
            // in seconds
            this.updatePosition(this.gsapTimeline.time() * 1000);
        },
    });

    updated$: Subject<TimelineService> = new Subject<TimelineService>();
    positionUpdated$: Subject<number> = new Subject<number>();
    constructor() {}

    updatePosition(p: number) {
        this.position.set(p);
        this.positionUpdated$.next(p);
        this.gsapTimeline?.seek(p / 1000);
    }

    keyframePositionChanged(p: number, keyframe: Keyframe) {
        keyframe.time.set(p);
        this.updated();
    }

    addGroup(group: Animateable) {
        this.groups.update((g) => [...g, group]);
        this.updated();
    }

    updated() {
        this.updated$.next(this);
        this.calculateTweens();
    }

    calculateTweens() {
        this.gsapTimeline.clear();
        this.tweens = [];
        this.groups().forEach((group) => {
            group.tracks().forEach((track) => {
                const tweens: Tween[] = [];

                track.keyframes().forEach((keyframe, index) => {
                    const nextKeyframe = track.keyframes()[index + 1];
                    if (nextKeyframe) {
                        let fromVars: any;
                        let toVars: any;
                        if (track.name === 'position') {
                            fromVars = keyframe.value;
                            toVars = { ...nextKeyframe.value, duration: (nextKeyframe.time() - keyframe.time()) / 1000 };
                        } else {
                            fromVars = {
                                [track.name]: keyframe.value,
                            };
                            toVars = {
                                [track.name]: nextKeyframe.value,
                                duration: (nextKeyframe.time() - keyframe.time()) / 1000,
                            };
                        }

                        if (!keyframe.easing || keyframe.easing() === 'default') {
                        } else {
                            toVars.ease = keyframe.easing();
                        }

                        tweens.push({
                            start: signal(keyframe),
                            end: signal(nextKeyframe),
                        });

                        this.gsapTimeline.fromTo(group.animationTarget, fromVars, toVars, keyframe.time() / 1000);
                    } else {
                        const props: any = {
                            [track.name]: keyframe.value,
                        };
                        this.gsapTimeline.set(group.animationTarget, props, keyframe.time());
                    }
                });
                track.tweens.set(tweens);
            });
        });

        this.gsapTimeline.pause();
        this.gsapTimeline.seek(this.position() / 1000);
    }

    removeKeyframe(data: { keyframe: Keyframe; track: Track; group: Animateable }) {


        data.track.keyframes.update((k) => k.filter((k) => k !== data.keyframe));
    
        this.updated();
    }
}
