import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CoordinationService } from '../timeline/service/coordination.service';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
    selector: 'property-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ColorPickerModule],
    templateUrl: './property-editor.component.html',
    styleUrl: './property-editor.component.scss',
})
export class PropertyEditorComponent {
    coordinator: CoordinationService = inject(CoordinationService);
}
