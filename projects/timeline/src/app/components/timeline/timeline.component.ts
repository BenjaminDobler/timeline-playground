import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { TimelineRulerComponent } from './timeline-ruler/timeline-ruler.component';
import { Keyframe, Timeline } from './model/timeline.model';
import { TimelineService } from './service/timeline.service';
import { DragableDirective } from '../../directives/dragable.directive';

@Component({
  selector: 'timeline',
  standalone: true,
  imports: [CommonModule, TimelineRulerComponent, DragableDirective],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  timelineService: TimelineService = inject(TimelineService);
  @Input()
  timeline: Timeline | null = null;

  onScrubDragged(event: any) {
    if (this.timeline) {
      this.timelineService.updatePosition(
        event.x / this.timeline.pixelsPerMilliseconds
      );
    }
  }

  onKeyframeDragged(event: any, keyframe: Keyframe) {
    if (this.timeline) {
      this.timelineService.keyframePositionChanged(
        event.x / this.timeline.pixelsPerMilliseconds,
        keyframe
      );
    }
  }
}
