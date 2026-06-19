import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user.model';

const STORAGE_KEY = 'qalbum_users';
const CURRENT_USER_KEY = 'qalbum_current_user';
const STORAGE_VERSION_KEY = 'qalbum_storage_version';
const STORAGE_VERSION = 2;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: User[] = this.loadUsers();
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private loadUsers(): User[] {
    // Check for old data format and clear it
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (!version || Number(version) < STORAGE_VERSION) {
      // First launch after migration — clear legacy data
      localStorage.removeItem('qalbum_users');
      localStorage.removeItem('qalbum_albums');
      localStorage.removeItem('qalbum_photos');
      localStorage.removeItem('qalbum_trash');
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
      return [];
    }
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private loadCurrentUser(): User | null {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  private saveUsers(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
  }

  private encodePassword(raw: string): string {
    return btoa(raw); // base64 encoding for simple obfuscation (client-side only)
  }

  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  login(email: string, password: string): Observable<User | null> {
    const user = this.users.find(u => u.email === email);
    if (!user) return of(null);
    if (user.password !== this.encodePassword(password)) return of(null);
    this.currentUserSubject.next(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return of(user);
  }

  register(name: string, email: string, password: string): Observable<User | null> {
    const existing = this.users.find(u => u.email === email);
    if (existing) return of(null);
    const user: User = {
      id: 'user-' + Date.now(),
      name,
      email,
      password: this.encodePassword(password),
      joinedAt: new Date(),
    };
    this.users.push(user);
    this.saveUsers();
    // Auto-login after register
    this.currentUserSubject.next(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return of(user);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  updateProfile(name: string, email: string): Observable<User> {
    const user = this.getCurrentUser();
    if (!user) return of(null as unknown as User);
    user.name = name;
    user.email = email;
    this.saveUsers();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    return of(user);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    const user = this.getCurrentUser();
    if (!user) return of(false);
    if (user.password !== this.encodePassword(oldPassword)) return of(false);
    user.password = this.encodePassword(newPassword);
    this.saveUsers();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return of(true);
  }
}
