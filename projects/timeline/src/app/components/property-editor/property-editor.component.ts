import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CoordinationService } from '../timeline/service/coordination.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'property-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './property-editor.component.html',
    styleUrl: './property-editor.component.scss',
})
export class PropertyEditorComponent {
    coordinator: CoordinationService = inject(CoordinationService);
}
