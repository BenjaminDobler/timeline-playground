import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PentoolComponent } from './components/pentool/pentool.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PentoolComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'pentool';
}
