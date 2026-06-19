import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TrashItem, Photo } from '../models/photo.model';

const STORAGE_KEY = 'qalbum_trash';
const RETENTION_DAYS = 30;

@Injectable({ providedIn: 'root' })
export class TrashService {
  private items: TrashItem[] = this.loadItems();
  private itemsSubject = new BehaviorSubject<TrashItem[]>(this.items);
  items$ = this.itemsSubject.asObservable();

  private loadItems(): TrashItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const items: TrashItem[] = JSON.parse(data);
    const now = Date.now();
    return items.filter(i => new Date(i.expiresAt).getTime() > now);
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    this.itemsSubject.next([...this.items]);
  }

  addToTrash(photos: Photo[], originalAlbumName: string): void {
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
    return this.items$;
  }

  restoreItem(itemId: string): Observable<Photo> {
    const index = this.items.findIndex(i => i.id === itemId);
    const item = this.items[index];
    this.items.splice(index, 1);
    this.save();
    return of(item.photo);
  }

  restoreAll(): Observable<Photo[]> {
    const photos = this.items.map(i => i.photo);
    this.items = [];
    this.save();
    return of(photos);
  }

  permanentlyDelete(itemId: string): Observable<void> {
    this.items = this.items.filter(i => i.id !== itemId);
    this.save();
    return of(undefined);
  }

  emptyTrash(): Observable<void> {
    this.items = [];
    this.save();
    return of(undefined);
  }

  private cleanExpired(): void {
    const now = Date.now();
    const before = this.items.length;
    this.items = this.items.filter(i => new Date(i.expiresAt).getTime() > now);
    if (this.items.length !== before) this.save();
  }
}
