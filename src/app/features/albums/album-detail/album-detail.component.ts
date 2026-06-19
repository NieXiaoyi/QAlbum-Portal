import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PhotoService } from '../../../core/services/photo.service';
import { AlbumService } from '../../../core/services/album.service';
import { TrashService } from '../../../core/services/trash.service';
import { Photo } from '../../../core/models/photo.model';
import { Album } from '../../../core/models/album.model';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss']
})
export class AlbumDetailComponent implements OnInit {
  album?: Album;
  photos: Photo[] = [];

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private albumService: AlbumService,
    private trashService: TrashService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.albumService.getAlbum(id).subscribe(a => this.album = a);
    this.photoService.getPhotos(id).subscribe(p => this.photos = p);
  }
}
