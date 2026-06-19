import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PhotoService } from '../../core/services/photo.service';
import { AlbumService } from '../../core/services/album.service';
import { AuthService } from '../../core/services/auth.service';
import { Photo } from '../../core/models/photo.model';
import { UploadDialogComponent } from '../../shared/components/upload-dialog/upload-dialog.component';

interface PhotoGroup {
  label: string;
  date: Date;
  photos: Photo[];
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, RouterModule, UploadDialogComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
  photoGroups: PhotoGroup[] = [];
  totalPhotos = 0;
  get spaceName(): string {
    return this.authService.getCurrentUser()?.name + ' 的相册' || '我的相册';
  }
  showUpload = false;

  constructor(
    private photoService: PhotoService,
    private albumService: AlbumService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.photoService.getPhotos().subscribe(photos => {
      this.totalPhotos = photos.length;
      this.photoGroups = this.groupByMonth(photos);
    });
  }

  private groupByMonth(photos: Photo[]): PhotoGroup[] {
    const groups = new Map<string, Photo[]>();
    photos.forEach(p => {
      const d = new Date(p.uploadedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    const labels = new Map([
      ['0', '1 月'], ['1', '2 月'], ['2', '3 月'], ['3', '4 月'],
      ['4', '5 月'], ['5', '6 月'], ['6', '7 月'], ['7', '8 月'],
      ['8', '9 月'], ['9', '10 月'], ['10', '11 月'], ['11', '12 月'],
    ]);

    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, photos]) => {
        const [year, month] = key.split('-');
        return {
          label: `${year} 年 ${labels.get(month) || (parseInt(month) + 1) + ' 月'}`,
          date: new Date(parseInt(year), parseInt(month)),
          photos,
        };
      });
  }

  onUploaded(): void {
    this.showUpload = false;
    this.ngOnInit();
  }
}
