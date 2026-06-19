import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Album } from '../models/album.model';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'qalbum_albums';

@Injectable({ providedIn: 'root' })
export class AlbumService {
  private albums: Album[] = this.loadAlbums();
  private albumsSubject!: BehaviorSubject<Album[]>;
  albums$!: Observable<Album[]>;

  constructor(private authService: AuthService) {
    this.albumsSubject = new BehaviorSubject<Album[]>(this.filteredAlbums());
    this.albums$ = this.albumsSubject.asObservable();
  }

  private loadAlbums(): Album[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private filteredAlbums(): Album[] {
    const user = this.authService.getCurrentUser();
    if (!user) return [];
    return this.albums.filter(a => a.ownerId === user.id);
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.albums));
    this.albumsSubject.next(this.filteredAlbums());
  }

  getAlbums(): Observable<Album[]> {
    return this.albums$;
  }

  getAlbum(id: string): Observable<Album | undefined> {
    return of(this.albums.find(a => a.id === id && a.ownerId === this.authService.getCurrentUser()?.id));
  }

  createAlbum(name: string, description: string): Observable<Album> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null as unknown as Album);
    const album: Album = {
      id: 'album-' + Date.now(),
      name,
      description,
      photoCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: user.id,
    };
    this.albums.push(album);
    this.save();
    return of(album);
  }

  updateAlbum(id: string, updates: Partial<Album>): Observable<Album> {
    const album = this.albums.find(a => a.id === id && a.ownerId === this.authService.getCurrentUser()?.id);
    if (!album) return of(null as unknown as Album);
    Object.assign(album, updates, { updatedAt: new Date() });
    this.save();
    return of(album);
  }

  deleteAlbum(id: string): Observable<void> {
    this.albums = this.albums.filter(a => !(a.id === id && a.ownerId === this.authService.getCurrentUser()?.id));
    this.save();
    return of(undefined);
  }
}
