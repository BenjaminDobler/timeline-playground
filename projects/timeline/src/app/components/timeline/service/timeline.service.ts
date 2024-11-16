import { Injectable } from '@angular/core';
import { Group, Keyframe, Timeline } from '../model/timeline.model';
import { Subject } from 'rxjs';
import { Time } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class TimelineService {
    timeline: Timeline;

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
    }

    keyframePositionChanged(p: number, keyframe: Keyframe) {
        keyframe.time = p;
    }

    addGroup(group: Group) {
        this.timeline.groups.push(group);
        this.updated();
    }

    updated() {
        this.updated$.next(this.timeline);
    }
}
