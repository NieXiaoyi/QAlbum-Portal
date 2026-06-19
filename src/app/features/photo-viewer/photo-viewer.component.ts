import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PhotoService } from '../../core/services/photo.service';
import { TrashService } from '../../core/services/trash.service';
import { AlbumService } from '../../core/services/album.service';
import { Photo } from '../../core/models/photo.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.scss']
})
export class PhotoViewerComponent implements OnInit {
  photo?: Photo;
  albumName = '';

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private trashService: TrashService,
    private albumService: AlbumService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.photoService.getPhoto(id).subscribe(p => {
      this.photo = p;
      if (p) {
        this.albumService.getAlbum(p.albumId).subscribe(a => {
          this.albumName = a?.name || '';
        });
      }
    });
  }

  goBack(): void { this.location.back(); }

  deletePhoto(): void {
    if (!this.photo || !confirm('确定删除这张照片？')) return;
    this.trashService.addToTrash([this.photo], this.albumName);
    this.photoService.deletePhotos([this.photo.id]).subscribe(() => this.goBack());
  }
}
