import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimelineComponent } from './components/timeline/timeline.component';
import { TimelineService } from './components/timeline/service/timeline.service';
import { TimelineCanvasComponent } from './components/timeline-canvas/timeline-canvas.component';
import { CoordinationService } from './components/timeline/service/coordination.service';
import { PropertyEditorComponent } from './components/property-editor/property-editor.component';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-root',
    imports: [
        ButtonModule,
        CommonModule,
        FormsModule,
        TimelineComponent,
        TimelineCanvasComponent,
        PropertyEditorComponent,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    title = 'timeline';

    coordinationService: CoordinationService = inject(CoordinationService);
    timelineService: TimelineService = inject(TimelineService);
    pixelsPerMilliseconds = 0.001;
}
