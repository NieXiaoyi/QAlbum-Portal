import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Album } from '../models/album.model';
import { User } from '../models/user.model';

const STORAGE_KEY = 'qalbum_albums';

@Injectable({ providedIn: 'root' })
export class AlbumService {
  private albums: Album[] = this.loadAlbums();
  private albumsSubject = new BehaviorSubject<Album[]>(this.albums);
  albums$ = this.albumsSubject.asObservable();

  private loadAlbums(): Album[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.albums));
    this.albumsSubject.next([...this.albums]);
  }

  getAlbums(): Observable<Album[]> {
    return this.albums$;
  }

  getAlbum(id: string): Observable<Album | undefined> {
    return of(this.albums.find(a => a.id === id));
  }

  createAlbum(name: string, description: string, user: User): Observable<Album> {
    const album: Album = {
      id: 'album-' + Date.now(),
      name,
      description,
      photoCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [user],
    };
    this.albums.push(album);
    this.save();
    return of(album);
  }

  updateAlbum(id: string, updates: Partial<Album>): Observable<Album> {
    const album = this.albums.find(a => a.id === id)!;
    Object.assign(album, updates, { updatedAt: new Date() });
    this.save();
    return of(album);
  }

  deleteAlbum(id: string): Observable<void> {
    this.albums = this.albums.filter(a => a.id !== id);
    this.save();
    return of(undefined);
  }
}
