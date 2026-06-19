import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlbumService } from '../../../core/services/album.service';
import { PhotoService } from '../../../core/services/photo.service';
import { Album } from '../../../core/models/album.model';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onClose()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>上传照片</h3>

        <div class="drop-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
          <div class="drop-icon">📤</div>
          <p>点击选择照片</p>
          <span class="hint">或拖拽照片到此处</span>
          <input
            type="file"
            multiple
            accept="image/*"
            (change)="onFilesSelected($event)"
            #fileInput
            style="display:none"
          >
          <button class="select-btn" (click)="fileInput.click()">选择文件</button>
        </div>

        <div class="album-select" *ngIf="albums.length">
          <label>保存到相册</label>
          <select [(ngModel)]="selectedAlbumId">
            <option *ngFor="let a of albums" [value]="a.id">{{ a.name }}</option>
          </select>
        </div>

        <div class="preview" *ngIf="previews.length">
          <span class="preview-label">已选择 {{ previews.length }} 张照片</span>
          <div class="thumbnails">
            <img *ngFor="let p of previews" [src]="p" class="thumb">
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" (click)="onClose()">取消</button>
          <button class="btn-confirm" (click)="onUpload()" [disabled]="!selectedFiles.length">
            开始上传
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #FFFCF8; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto; }
    h3 { font-size: 18px; color: #5A4A3A; text-align: center; margin-bottom: 16px; }
    .drop-zone { border: 2px dashed #E8D5C0; border-radius: 12px; padding: 32px; text-align: center; background: #FFF8F0; }
    .drop-icon { font-size: 36px; margin-bottom: 8px; }
    .hint { display: block; font-size: 11px; color: #B8A090; margin-top: 4px; }
    .select-btn { margin-top: 12px; padding: 8px 20px; background: #E8C9A0; color: white; border-radius: 8px; font-size: 13px; }
    .album-select { margin-top: 12px; }
    .album-select label { font-size: 13px; color: #5A4A3A; display: block; margin-bottom: 6px; }
    .album-select select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #F0E6DA; background: #FFF8F0; font-size: 13px; color: #5A4A3A; }
    .preview { margin-top: 12px; }
    .preview-label { font-size: 12px; color: #B8A090; display: block; margin-bottom: 6px; }
    .thumbnails { display: flex; gap: 4px; flex-wrap: wrap; }
    .thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
    .actions { display: flex; gap: 8px; margin-top: 16px; }
    .btn-cancel { flex: 1; padding: 10px; border-radius: 8px; background: #F5EDE4; color: #B8A090; font-size: 13px; font-weight: 600; }
    .btn-confirm { flex: 1; padding: 10px; border-radius: 8px; background: #E8C9A0; color: white; font-size: 13px; font-weight: 600; }
    .btn-confirm:disabled { opacity: 0.5; }
  `]
})
export class UploadDialogComponent {
  @Output() uploaded = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  albums: Album[] = [];
  selectedAlbumId: string = '';
  selectedFiles: File[] = [];
  previews: string[] = [];

  constructor(
    private albumService: AlbumService,
    private photoService: PhotoService
  ) {
    this.albumService.getAlbums().subscribe(a => {
      this.albums = a;
      if (a.length) this.selectedAlbumId = a[0].id;
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  private addFiles(files: File[]): void {
    this.selectedFiles = files;
    this.previews = files.map(f => URL.createObjectURL(f));
  }

  onUpload(): void {
    if (!this.selectedAlbumId) return;
    this.photoService.uploadPhotos(this.selectedFiles, this.selectedAlbumId)
      .subscribe(() => {
        this.uploaded.emit();
        this.onClose();
      });
  }

  onClose(): void { this.close.emit(); }
}
