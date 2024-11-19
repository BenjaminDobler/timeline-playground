import { signal, Signal, WritableSignal } from '@angular/core';



// export interface Group {
//   name: string;
//   expanded: boolean;
//   tracks: Track[];
//   animationTarget?: any;
//   domRef?: any;
// }

export interface AnimateableProperty {
    name: string;
    type: 'string' | 'number' | 'color';
    displayName: string;
    group?: string;
}

export interface Animateable {
    name: string;
    type: string;
    properties: AnimateableProperty[];
    animationTarget: any;
    domRef: HTMLElement;
    uiExpanded?: boolean;
    tracks: WritableSignal<Track[]>;
}

export class Rectangle implements Animateable {
    type = 'Rectangle';
    name = 'Rectangle';
    // tracks = [];
    tracks = signal([]);
    properties: AnimateableProperty[] = [
        { displayName: 'X', name: 'x', type: 'number', group: 'position' },
        { displayName: 'Y', name: 'y', type: 'number', group: 'position' },
        { displayName: 'W', name: 'width', type: 'number' },
        { displayName: 'H', name: 'height', type: 'number' },
        { displayName: 'R', name: 'borderRadius', type: 'number' },
        { displayName: 'r', name: 'rotation', type: 'number' },
        { displayName: 'C', name: 'background', type: 'color' },
    ];

    constructor(
        public animationTarget: any,
        public domRef: HTMLElement,
    ) {}
}

export class TextDiv implements Animateable {
    type = 'TextDiv';
    name = 'TextDiv';
    tracks = signal([]);
    properties: AnimateableProperty[] = [
        { displayName: 'X', name: 'x', type: 'number' },
        { displayName: 'Y', name: 'y', type: 'number' },
        { displayName: 'W', name: 'width', type: 'number' },
        { displayName: 'H', name: 'height', type: 'number' },
        { displayName: 'C', name: 'color', type: 'color' },
    ];

    constructor(
        public animationTarget: any,
        public domRef: HTMLElement,
    ) {}
}

export interface Track {
    name: string;
    keyframes: WritableSignal<Keyframe[]>;
    tweens: WritableSignal<Tween[]>;
}

export interface Keyframe {
    time: WritableSignal<number>;
    value: WritableSignal<any>;
    easing?: WritableSignal<string>;
}

export interface Tween {
    start: WritableSignal<Keyframe>;
    end: WritableSignal<Keyframe>;
}
