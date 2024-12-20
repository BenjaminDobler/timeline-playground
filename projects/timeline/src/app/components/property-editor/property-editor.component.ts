import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CoordinationService } from '../timeline/service/coordination.service';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { Animateable } from '../timeline/model/timeline.model';

@Component({
    selector: 'property-editor',
    imports: [CommonModule, FormsModule, ColorPickerModule],
    templateUrl: './property-editor.component.html',
    styleUrl: './property-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyEditorComponent {

    animatable = input<Animateable>();
    coordinator: CoordinationService = inject(CoordinationService);
}
