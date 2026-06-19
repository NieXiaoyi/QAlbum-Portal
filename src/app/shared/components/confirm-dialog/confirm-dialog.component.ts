import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>{{ data.title }}</h3>
        <p>{{ data.message }}</p>
        <div class="actions">
          <button class="btn-cancel" (click)="onCancel()">
            {{ data.cancelText || '取消' }}
          </button>
          <button
            class="btn-confirm"
            [class.danger]="data.danger"
            (click)="onConfirm()"
          >
            {{ data.confirmText || '确定' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .dialog {
      background: #FFFCF8; border-radius: 16px;
      padding: 24px; max-width: 320px; width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    h3 { font-size: 16px; color: #5A4A3A; margin-bottom: 8px; }
    p { font-size: 13px; color: #B8A090; line-height: 1.5; margin-bottom: 20px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    button {
      padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
    }
    .btn-cancel { background: #F5EDE4; color: #B8A090; }
    .btn-confirm { background: #E8C9A0; color: white; }
    .btn-confirm.danger { background: #D47A5A; }
  `]
})
export class ConfirmDialogComponent {
  constructor(@Inject('CONFIRM_DATA') public data: ConfirmDialogData) {}

  private resolve!: (result: boolean) => void;
  promise = new Promise<boolean>(resolve => this.resolve = resolve);

  onConfirm(): void { this.resolve(true); }
  onCancel(): void { this.resolve(false); }
}
