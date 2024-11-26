import { Component, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SvgEditComponent } from '../../../pentool2/src/app/components/svg-edit/svg-edit.component';
import { SVGEdit } from './svgedit/svgedit';
import { Point } from './svgedit/point';

@Component({
    selector: 'app-root',
    imports: [],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    svg = viewChild('svg_canvas');

    title = 'dragdrop-svg';

    ngAfterViewInit() {
        const s: any = this.svg();
        console.log(s);
        if (s) {
            const svgEdit = new SVGEdit();
            svgEdit.svg = s.nativeElement;
            svgEdit.init();
        }
    }
}
