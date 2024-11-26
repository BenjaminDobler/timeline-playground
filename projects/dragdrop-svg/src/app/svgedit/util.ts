import { Point } from './point';

export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;

    const c = Math.sqrt(a * a + b * b);
    return c;
}

export function getAngle(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    let angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return angle;
}

export function isInWhichSegment(pathElement: any, x: number, y: number) {
    var seg;
    // You get get the coordinates at the length of the path, so you
    // check at all length point to see if it matches
    // the coordinates of the click
    const len = pathElement.getTotalLength();
    for (var i = 0; i < len; i++) {
        var pt = pathElement.getPointAtLength(i);
        // you need to take into account the stroke width, hence the +- 2
        if (pt.x < x + 2 && pt.x > x - 2 && pt.y > y - 2 && pt.y < y + 2) {
            seg = pathElement.getPathSegAtLength(i);
            break;
        }
    }
    return seg;
}

export function insertAt(arr: any[], position: number, item: any) {
    const newArray = [...arr.slice(0, position), item, ...arr.slice(position)];
    return newArray;
}

export function bringToTopofSVG(targetElement: SVGElement) {
    let parent = targetElement.ownerSVGElement;
    if (parent) {
        parent.appendChild(targetElement);
    }
}
