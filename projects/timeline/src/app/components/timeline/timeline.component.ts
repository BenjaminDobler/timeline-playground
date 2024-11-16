import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, inject, viewChild } from '@angular/core';
import { TimelineRulerComponent } from './timeline-ruler/timeline-ruler.component';
import { Keyframe, Timeline, Tween } from './model/timeline.model';
import { TimelineService } from './service/timeline.service';
import { DragableDirective } from '../../directives/dragable.directive';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'timeline',
    standalone: true,
    imports: [CommonModule, TimelineRulerComponent, DragableDirective, ContextMenuModule, ButtonModule, DialogModule, DropdownModule, FormsModule],
    templateUrl: './timeline.component.html',
    styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
    timelineService: TimelineService = inject(TimelineService);
    @Input()
    timeline: Timeline | null = null;

    cm? = viewChild<ContextMenu>('cm');
    eadingDialogVisible = false;

    items: MenuItem[] = [
        {
            label: 'Easing',
            command: () => {
                console.log('open easing dialog');
                this.eadingDialogVisible = true;
            },
        },
    ];

    easings = [
      'default',
      'power1.out', 
      'power1.in', 
      'power1.inOut', 
      'bounce.out',
      'bounce.in',
      'bounce.inOut'
    ];

    selectedCMTween?: Tween;
    onTweenContextMenu(event: any, tween: Tween) {
        console.log('on tween contextmenu');
        this.selectedCMTween = tween;
        if (this.cm !== undefined) {
            console.log('show');
            this.cm()?.show(event);
        } else {
            console.log('not defined');
        }
    }

    onScrubDragged(event: any) {
        if (this.timeline) {
            this.timelineService.updatePosition(event.x / this.timeline.pixelsPerMilliseconds);
        }
    }

    onKeyframeDragged(event: any, keyframe: Keyframe) {
        if (this.timeline) {
            this.timelineService.keyframePositionChanged(event.x / this.timeline.pixelsPerMilliseconds, keyframe);
        }
    }
}
