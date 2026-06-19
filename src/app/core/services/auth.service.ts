import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user.model';

const STORAGE_KEY = 'qalbum_users';
const CURRENT_USER_KEY = 'qalbum_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: User[] = this.loadUsers();
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private loadUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
    const admin: User = {
      id: 'admin-1',
      name: '管理员',
      email: 'admin@family.com',
      role: 'admin',
      status: 'active',
      joinedAt: new Date('2026-01-01'),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([admin]));
    return [admin];
  }

  private loadCurrentUser(): User | null {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  private saveUsers(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
  }

  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  getPendingUsers(): Observable<User[]> {
    return of(this.users.filter(u => u.status === 'pending'));
  }

  login(userId: string): Observable<User> {
    const user = this.users.find(u => u.id === userId)!;
    this.currentUserSubject.next(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return of(user);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  register(name: string, email: string): Observable<User> {
    const user: User = {
      id: 'user-' + Date.now(),
      name,
      email,
      role: 'member',
      status: 'pending',
      joinedAt: new Date(),
    };
    this.users.push(user);
    this.saveUsers();
    return of(user);
  }

  approveMember(userId: string): Observable<User> {
    const user = this.users.find(u => u.id === userId)!;
    user.status = 'active';
    this.saveUsers();
    return of(user);
  }

  rejectMember(userId: string): Observable<void> {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();
    return of(undefined);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}
