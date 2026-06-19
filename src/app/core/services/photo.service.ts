import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Photo } from '../models/photo.model';

const STORAGE_KEY = 'qalbum_photos';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private photos: Photo[] = this.loadPhotos();
  private photosSubject = new BehaviorSubject<Photo[]>(this.photos);
  photos$ = this.photosSubject.asObservable();

  private loadPhotos(): Photo[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.photos));
    this.photosSubject.next([...this.photos]);
  }

  getPhotos(albumId?: string): Observable<Photo[]> {
    if (albumId) {
      return of(this.photos.filter(p => p.albumId === albumId));
    }
    return this.photos$;
  }

  getPhoto(id: string): Observable<Photo | undefined> {
    return of(this.photos.find(p => p.id === id));
  }

  uploadPhotos(files: File[], albumId: string, userId: string): Observable<Photo[]> {
    const newPhotos: Photo[] = [];
    files.forEach(file => {
      const photo: Photo = {
        id: 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        albumId,
        fileName: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: userId,
      };
      newPhotos.push(photo);
    });
    this.photos.push(...newPhotos);
    this.save();
    return of(newPhotos);
  }

  movePhotos(photoIds: string[], targetAlbumId: string): Observable<Photo[]> {
    const moved: Photo[] = [];
    photoIds.forEach(id => {
      const photo = this.photos.find(p => p.id === id);
      if (photo) {
        photo.albumId = targetAlbumId;
        moved.push(photo);
      }
    });
    this.save();
    return of(moved);
  }

  deletePhotos(photoIds: string[]): Observable<Photo[]> {
    const deleted: Photo[] = [];
    this.photos = this.photos.filter(p => {
      if (photoIds.includes(p.id)) {
        deleted.push(p);
        return false;
      }
      return true;
    });
    this.save();
    return of(deleted);
  }
}
