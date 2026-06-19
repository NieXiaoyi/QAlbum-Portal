import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Photo } from '../models/photo.model';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'qalbum_photos';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private photos: Photo[] = this.loadPhotos();
  private photosSubject = new BehaviorSubject<Photo[]>(this.photos);
  photos$ = this.photosSubject.asObservable();

  constructor(private authService: AuthService) {}

  private loadPhotos(): Photo[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.photos));
    this.photosSubject.next([...this.photos]);
  }

  getPhotos(albumId?: string): Observable<Photo[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return of([]);
    let result = this.photos.filter(p => p.ownerId === user.id);
    if (albumId) result = result.filter(p => p.albumId === albumId);
    return of(result);
  }

  getPhoto(id: string): Observable<Photo | undefined> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(undefined);
    return of(this.photos.find(p => p.id === id && p.ownerId === user.id));
  }

  uploadPhotos(files: File[], albumId: string): Observable<Photo[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return of([]);
    const newPhotos: Photo[] = [];
    files.forEach(file => {
      const photo: Photo = {
        id: 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        albumId,
        ownerId: user.id,
        fileName: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: user.id,
      };
      newPhotos.push(photo);
    });
    this.photos.push(...newPhotos);
    this.save();
    return of(newPhotos);
  }

  movePhotos(photoIds: string[], targetAlbumId: string): Observable<Photo[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return of([]);
    const moved: Photo[] = [];
    photoIds.forEach(id => {
      const photo = this.photos.find(p => p.id === id && p.ownerId === user.id);
      if (photo) {
        photo.albumId = targetAlbumId;
        moved.push(photo);
      }
    });
    this.save();
    return of(moved);
  }

  deletePhotos(photoIds: string[]): Observable<Photo[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return of([]);
    const deleted: Photo[] = [];
    this.photos = this.photos.filter(p => {
      if (photoIds.includes(p.id) && p.ownerId === user.id) {
        deleted.push(p);
        return false;
      }
      return true;
    });
    this.save();
    return of(deleted);
  }
}
