import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ViewMode = 'list' | 'grid';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  template: `
    <div class="toggle">
      <button
        [class.active]="mode === 'list'"
        (click)="switch('list')"
        class="toggle-btn"
      >☰ 列表</button>
      <button
        [class.active]="mode === 'grid'"
        (click)="switch('grid')"
        class="toggle-btn"
      >▦ 平铺</button>
    </div>
  `,
  styles: [`
    .toggle {
      display: flex;
      background: #F5EDE4;
      border-radius: 10px;
      padding: 3px;
      gap: 2px;
    }
    .toggle-btn {
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #B8A090;
      transition: all 0.2s;
    }
    .toggle-btn.active {
      background: white;
      color: #D4956A;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
  `]
})
export class ViewToggleComponent {
  @Input() mode: ViewMode = 'grid';
  @Output() modeChange = new EventEmitter<ViewMode>();

  switch(m: ViewMode): void {
    this.mode = m;
    this.modeChange.emit(m);
    localStorage.setItem('qalbum_view_mode', m);
  }
}
