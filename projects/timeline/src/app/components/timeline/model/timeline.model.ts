export interface Timeline {
  groups: Animateable[];
  pixelsPerMilliseconds: number;
  duration: number;
  position: number;
}

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
  tracks: Track[];

}

export class Rectangle implements Animateable {
  type = 'Rectangle';
  name = 'Rectangle';
  tracks = [];
  properties: AnimateableProperty[] = [
      { displayName: 'X', name: 'x', type: 'number', group: 'Position' },
      { displayName: 'Y', name: 'y', type: 'number', group: 'Position' },
      { displayName: 'W', name: 'width', type: 'number', group: 'Size' },
      { displayName: 'H', name: 'height', type: 'number', group: 'Size' },
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
  tracks = [];
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
  keyframes: Keyframe[];
  tweens: Tween[];
}

export interface Keyframe {
  time: number;
  value: any;
  easing?: string;
}

export interface Tween {
  start: Keyframe;
  end: Keyframe;
}
