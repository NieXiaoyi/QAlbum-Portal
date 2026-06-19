import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrashService } from '../../core/services/trash.service';
import { PhotoService } from '../../core/services/photo.service';
import { TrashItem } from '../../core/models/photo.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

type TrashTab = 'photos' | 'albums';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.scss']
})
export class TrashComponent implements OnInit {
  items: TrashItem[] = [];
  activeTab: TrashTab = 'photos';

  constructor(
    private trashService: TrashService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.trashService.getItems().subscribe(i => this.items = i);
  }

  get photoItems(): TrashItem[] {
    return this.activeTab === 'photos' ? this.items : [];
  }

  restoreItem(id: string): void {
    this.trashService.restoreItem(id).subscribe(photo => {
      this.photoService.movePhotos([photo.id], photo.albumId).subscribe(() => this.ngOnInit());
    });
  }

  restoreAll(): void {
    if (!confirm('恢复所有已删除的照片？')) return;
    this.trashService.restoreAll().subscribe(() => this.ngOnInit());
  }

  emptyTrash(): void {
    if (!confirm('确定清空回收站？此操作不可恢复！')) return;
    this.trashService.emptyTrash().subscribe(() => this.ngOnInit());
  }
}
