import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlbumService } from '../../../core/services/album.service';
import { Album } from '../../../core/models/album.model';
import { ViewToggleComponent, ViewMode } from '../../../shared/components/view-toggle/view-toggle.component';

@Component({
  selector: 'app-album-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ViewToggleComponent],
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent implements OnInit {
  albums: Album[] = [];
  viewMode: ViewMode = (localStorage.getItem('qalbum_view_mode') as ViewMode) || 'grid';
  showCreateDialog = false;
  newAlbumName = '';
  newAlbumDesc = '';

  constructor(
    private albumService: AlbumService
  ) {}

  ngOnInit(): void {
    this.albumService.getAlbums().subscribe(a => this.albums = a);
  }

  createAlbum(): void {
    if (!this.newAlbumName.trim()) return;
    this.albumService.createAlbum(this.newAlbumName, this.newAlbumDesc)
      .subscribe(() => {
        this.showCreateDialog = false;
        this.newAlbumName = '';
        this.newAlbumDesc = '';
      });
  }

  deleteAlbum(id: string): void {
    if (confirm('确定删除这个相册？照片将移入回收站')) {
      this.albumService.deleteAlbum(id).subscribe();
    }
  }
}
