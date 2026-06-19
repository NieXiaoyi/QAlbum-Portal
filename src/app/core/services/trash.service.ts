import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TrashItem, Photo } from '../models/photo.model';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'qalbum_trash';
const RETENTION_DAYS = 30;

@Injectable({ providedIn: 'root' })
export class TrashService {
  private items: TrashItem[] = this.loadItems();
  private itemsSubject = new BehaviorSubject<TrashItem[]>(this.items);
  items$ = this.itemsSubject.asObservable();

  constructor(private authService: AuthService) {}

  private loadItems(): TrashItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const items: TrashItem[] = JSON.parse(data);
    const now = Date.now();
    return items.filter(i => new Date(i.expiresAt).getTime() > now);
  }

  private get filteredItems(): TrashItem[] {
    const user = this.authService.getCurrentUser();
    if (!user) return [];
    return this.items.filter(i => i.photo.ownerId === user.id);
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    this.itemsSubject.next([...this.items]);
  }

  addToTrash(photos: Photo[], originalAlbumName: string): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    photos.forEach(photo => {
      this.items.push({
        id: 'trash-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        originalAlbumId: photo.albumId,
        originalAlbumName,
        photo,
        deletedAt: now,
        expiresAt,
      });
    });
    this.save();
  }

  getItems(): Observable<TrashItem[]> {
    this.cleanExpired();
    return of(this.filteredItems);
  }

  restoreItem(itemId: string): Observable<Photo | null> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);
    const index = this.items.findIndex(i => i.id === itemId && i.photo.ownerId === user.id);
    if (index === -1) return of(null);
    const item = this.items[index];
    this.items.splice(index, 1);
    this.save();
    return of(item.photo);
  }

  restoreAll(): Observable<Photo[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return of([]);
    const photos = this.filteredItems.map(i => i.photo);
    this.items = this.items.filter(i => i.photo.ownerId !== user.id);
    this.save();
    return of(photos);
  }

  permanentlyDelete(itemId: string): Observable<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(undefined);
    this.items = this.items.filter(i => !(i.id === itemId && i.photo.ownerId === user.id));
    this.save();
    return of(undefined);
  }

  emptyTrash(): Observable<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(undefined);
    this.items = this.items.filter(i => i.photo.ownerId !== user.id);
    this.save();
    return of(undefined);
  }

  private cleanExpired(): void {
    const now = Date.now();
    this.items = this.items.filter(i => new Date(i.expiresAt).getTime() > now);
  }
}
