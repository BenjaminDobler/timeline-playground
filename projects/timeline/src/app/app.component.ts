import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TimelineRulerComponent } from './components/timeline/timeline-ruler/timeline-ruler.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimelineComponent } from './components/timeline/timeline.component';
import { TimelineService } from './components/timeline/service/timeline.service';
import { TimelineCanvasComponent } from './components/timeline-canvas/timeline-canvas.component';
import { CoordinationService } from './components/timeline/service/coordination.service';
import { PropertyEditorComponent } from './components/property-editor/property-editor.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, TimelineRulerComponent, CommonModule, FormsModule, TimelineComponent, TimelineCanvasComponent, PropertyEditorComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'timeline';

    coordinationService: CoordinationService = inject(CoordinationService);
    timelineService: TimelineService = inject(TimelineService);
    pixelsPerMilliseconds = 0.001;
}
