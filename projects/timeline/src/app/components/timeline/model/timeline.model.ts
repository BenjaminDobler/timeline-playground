export interface Timeline {
  groups: Group[];
  pixelsPerMilliseconds: number;
  duration: number;
  position: number;
}

export interface Group {
  name: string;
  expanded: boolean;
  tracks: Track[];
  target?: any;
}

export interface Track {
  name: string;
  keyframes: Keyframe[];
}

export interface Keyframe {
  time: number;
  value: number;
}
