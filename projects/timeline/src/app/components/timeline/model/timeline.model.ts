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
    isSvg: boolean;
}

export class Rectangle implements Animateable {
    type = 'Rectangle';
    name = 'Rectangle';
    isSvg = false;
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

export class PathAnimatable implements Animateable {
    type = 'Path';
    name = 'Path';
    isSvg = true;

    // tracks = [];
    tracks = signal([]);
    properties: AnimateableProperty[] = [
        { displayName: 'd', name: 'd', type: 'string' },
        { displayName: 's', name: 'stroke', type: 'color' },
        { displayName: 'sw', name: 'stroke-width', type: 'number' },
        { displayName: 'f', name: 'fill', type: 'color' }

    ];

    constructor(
        public animationTarget: any,
        public domRef: HTMLElement,
    ) {}
}

export class TextDiv implements Animateable {
    type = 'TextDiv';
    name = 'TextDiv';
    isSvg = true;

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
