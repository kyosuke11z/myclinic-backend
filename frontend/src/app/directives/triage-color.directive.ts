import { Directive, ElementRef, Input, OnChanges, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appTriageColor]',
  standalone: true
})
export class TriageColorDirective implements OnChanges {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input('appTriageColor') triageLevel: 'Green' | 'Yellow' | 'Orange' | 'Red' | string | undefined;

  ngOnChanges(): void {
    this.applyStyles();
  }

  private applyStyles(): void {
    const host = this.el.nativeElement;
    
    // Reset styles and custom pulsing classes
    this.renderer.removeClass(host, 'blinking-pulse');
    this.renderer.setStyle(host, 'padding', '4px 10px');
    this.renderer.setStyle(host, 'border-radius', '50px');
    this.renderer.setStyle(host, 'font-size', '12px');
    this.renderer.setStyle(host, 'font-weight', '600');
    this.renderer.setStyle(host, 'display', 'inline-flex');
    this.renderer.setStyle(host, 'align-items', 'center');
    this.renderer.setStyle(host, 'justify-content', 'center');

    const level = this.triageLevel;
    
    if (level === 'Green') {
      this.renderer.setStyle(host, 'background-color', 'rgba(46, 204, 113, 0.12)');
      this.renderer.setStyle(host, 'color', '#27ae60');
      this.renderer.setStyle(host, 'border', '1.5px solid rgba(46, 204, 113, 0.25)');
    } else if (level === 'Yellow') {
      this.renderer.setStyle(host, 'background-color', 'rgba(241, 196, 15, 0.15)');
      this.renderer.setStyle(host, 'color', '#b7950b');
      this.renderer.setStyle(host, 'border', '1.5px solid rgba(241, 196, 15, 0.3)');
    } else if (level === 'Orange') {
      this.renderer.setStyle(host, 'background-color', 'rgba(230, 126, 34, 0.12)');
      this.renderer.setStyle(host, 'color', '#d35400');
      this.renderer.setStyle(host, 'border', '1.5px solid rgba(230, 126, 34, 0.25)');
    } else if (level === 'Red') {
      this.renderer.setStyle(host, 'background-color', 'rgba(231, 76, 60, 0.12)');
      this.renderer.setStyle(host, 'color', '#c0392b');
      this.renderer.setStyle(host, 'border', '1.5px solid rgba(231, 76, 60, 0.35)');
      this.renderer.setStyle(host, 'font-weight', '700');
      this.renderer.addClass(host, 'blinking-pulse');
    } else {
      // Fallback gray badge
      this.renderer.setStyle(host, 'background-color', '#f1f5f9');
      this.renderer.setStyle(host, 'color', '#64748b');
      this.renderer.setStyle(host, 'border', '1.5px solid #e2e8f0');
    }
  }
}
