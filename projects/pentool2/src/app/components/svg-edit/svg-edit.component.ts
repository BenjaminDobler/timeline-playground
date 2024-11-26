import { ChangeDetectionStrategy, Component, contentChild, ElementRef } from '@angular/core';

@Component({
    selector: 'app-svg-edit',
    imports: [],
    templateUrl: './svg-edit.component.html',
    styleUrl: './svg-edit.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SvgEditComponent {
    svgElement = contentChild<SVGElement>('svg_canvas');

    ngAfterViewInit() {
        console.log('conten ', this.svgElement());
    }
}
