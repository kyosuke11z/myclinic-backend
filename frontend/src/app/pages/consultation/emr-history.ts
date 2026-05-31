import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ThaiRelativeTimePipe } from '../../pipes/relative-time.pipe';
import { TriageColorDirective } from '../../directives/triage-color.directive';

@Component({
  selector: 'app-emr-history',
  standalone: true,
  imports: [ThaiRelativeTimePipe, TriageColorDirective],
  templateUrl: './emr-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrHistoryComponent {
  @Input() history: any = null;
}
