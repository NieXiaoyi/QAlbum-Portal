import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Album } from '../../../core/models/album.model';

@Component({
  selector: 'app-move-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>移动照片</h3>
        <p class="subtitle">选择 {{ photoCount }} 张照片的目标相册</p>

        <div class="album-list">
          <div
            *ngFor="let album of albums"
            class="album-item"
            [class.selected]="selectedAlbumId === album.id"
            (click)="selectedAlbumId = album.id"
          >
            <span>📁</span>
            <span class="name">{{ album.name }}</span>
            <span class="count">{{ album.photoCount }} 张</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" (click)="onCancel()">取消</button>
          <button class="btn-confirm" (click)="onConfirm()" [disabled]="!selectedAlbumId">
            移动到此处
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #FFFCF8; border-radius: 16px; padding: 24px; max-width: 360px; width: 90%; }
    h3 { font-size: 18px; color: #5A4A3A; text-align: center; }
    .subtitle { font-size: 12px; color: #B8A090; text-align: center; margin: 4px 0 16px; }
    .album-list { display: flex; flex-direction: column; gap: 8px; }
    .album-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; background: #FFF8F0; cursor: pointer; transition: all 0.2s; }
    .album-item:hover { background: #F5EDE4; }
    .album-item.selected { background: #E8C9A0; color: white; }
    .name { flex: 1; font-size: 13px; }
    .count { font-size: 12px; opacity: 0.7; }
    .actions { display: flex; gap: 8px; margin-top: 16px; }
    .btn-cancel { flex: 1; padding: 10px; border-radius: 8px; background: #F5EDE4; color: #B8A090; font-size: 13px; }
    .btn-confirm { flex: 1; padding: 10px; border-radius: 8px; background: #E8C9A0; color: white; font-size: 13px; font-weight: 600; }
    .btn-confirm:disabled { opacity: 0.5; }
  `]
})
export class MoveDialogComponent {
  @Input() albums: Album[] = [];
  @Input() photoCount: number = 1;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  selectedAlbumId: string = '';

  onConfirm(): void {
    if (this.selectedAlbumId) this.confirm.emit(this.selectedAlbumId);
  }
  onCancel(): void { this.cancel.emit(); }
}
