# QAlbum 私有云相册精简 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 QAlbum 从家族共享相册精简为个人私有云相册，每个用户独立空间，邮箱+密码登录。

**Architecture:** 在现有代码上精准裁剪——删除 role/status/members 等权限字段，新增 password/ownerId 字段，所有 Service 按 ownerId 做数据隔离，新增 LoginComponent + AuthGuard。

**Tech Stack:** Angular 22 + TypeScript 6.0 + Vitest

---

### Task 1: 更新 User 模型 + 重写 AuthService

**Files:**
- Modify: `src/app/core/models/user.model.ts`
- Modify: `src/app/core/services/auth.service.ts`

- [ ] **Step 1: 精简 User 模型**

编辑 `src/app/core/models/user.model.ts`，删除 role/status 枚举和字段，新增 password 字段：

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;  // btoa() encoded
  joinedAt: Date;
}
```

删除开头的 `export type UserRole = 'admin' | 'member';` 和 `export type MemberStatus = 'active' | 'pending';`。

- [ ] **Step 2: 重写 AuthService**

编辑 `src/app/core/services/auth.service.ts`，替换为以下内容。关键变化：删除预置管理员、删除 approveMember/rejectMember/getPendingUsers/isAdmin、增加 login (email+password) 和 register (带密码)、register 调用 `changePassword` 方法保存密码。

```typescript
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
    if (!version) {
      // First launch after migration — clear legacy data
      localStorage.removeItem('qalbum_users');
      localStorage.removeItem('qalbum_albums');
      localStorage.removeItem('qalbum_photos');
      localStorage.removeItem('qalbum_trash');
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
    return btoa(raw);
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
    return of(true);
  }
}
```

- [ ] **Step 3: 验证编译**

Run: `npm run build`
Expected: 构建成功（或仅与未改完的文件相关的错误，忽略它们）

---

### Task 2: 创建 AuthGuard + LoginComponent

**Files:**
- Create: `src/app/core/guards/auth.guard.ts`
- Create: `src/app/features/login/login.component.ts`
- Create: `src/app/features/login/login.component.html`
- Create: `src/app/features/login/login.component.scss`

- [ ] **Step 1: 创建 AuthGuard**

新建 `src/app/core/guards/auth.guard.ts`：

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
```

- [ ] **Step 2: 创建 LoginComponent TypeScript**

新建 `src/app/features/login/login.component.ts`：

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isRegisterMode = false;
  name = '';
  email = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.error = '';
    this.password = '';
  }

  submit(): void {
    this.error = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.error = '请填写所有必填字段';
      return;
    }
    if (this.password.length < 4) {
      this.error = '密码至少 4 位';
      return;
    }
    if (this.isRegisterMode) {
      if (!this.name.trim()) {
        this.error = '请填写姓名';
        return;
      }
      this.authService.register(this.name.trim(), this.email.trim(), this.password)
        .subscribe(user => {
          if (user) {
            this.router.navigate(['/']);
          } else {
            this.error = '该邮箱已注册';
          }
        });
    } else {
      this.authService.login(this.email.trim(), this.password)
        .subscribe(user => {
          if (user) {
            this.router.navigate(['/']);
          } else {
            this.error = '邮箱或密码错误';
          }
        });
    }
  }
}
```

- [ ] **Step 3: 创建 LoginComponent 模板**

新建 `src/app/features/login/login.component.html`：

```html
<div class="login-page">
  <div class="login-card">
    <div class="logo">📸</div>
    <h1>QAlbum</h1>
    <p class="subtitle">私有云相册</p>

    <div class="form">
      <div class="field" *ngIf="isRegisterMode">
        <label>姓名</label>
        <input type="text" placeholder="你的名字" [(ngModel)]="name" (keyup.enter)="submit()">
      </div>

      <div class="field">
        <label>邮箱</label>
        <input type="email" placeholder="your@email.com" [(ngModel)]="email" (keyup.enter)="submit()">
      </div>

      <div class="field">
        <label>密码</label>
        <input type="password" placeholder="至少 4 位" [(ngModel)]="password" (keyup.enter)="submit()">
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <button class="submit-btn" (click)="submit()">
        {{ isRegisterMode ? '注  册' : '登  录' }}
      </button>

      <div class="switch-mode">
        <span *ngIf="!isRegisterMode">
          没有账号？<a (click)="toggleMode()">去注册</a>
        </span>
        <span *ngIf="isRegisterMode">
          已有账号？<a (click)="toggleMode()">去登录</a>
        </span>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 创建 LoginComponent 样式**

新建 `src/app/features/login/login.component.scss`：

```scss
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF8F0 0%, #F5EDE4 100%);
  padding: 20px;
}

.login-card {
  background: #FFFCF8;
  border-radius: 20px;
  padding: 40px 32px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.logo {
  font-size: 48px;
  margin-bottom: 8px;
}

h1 {
  color: #5A4A3A;
  font-size: 24px;
  margin: 0;
}

.subtitle {
  color: #B8A090;
  font-size: 13px;
  margin: 4px 0 28px;
}

.form {
  text-align: left;
}

.field {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 12px;
    color: #8A7A6A;
    margin-bottom: 6px;
    font-weight: 600;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #F0E6DA;
    border-radius: 10px;
    background: #FFF8F0;
    font-size: 14px;
    color: #5A4A3A;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: #E8C9A0;
    }

    &::placeholder {
      color: #D0C0B0;
    }
  }
}

.error {
  color: #D47A5A;
  font-size: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #FDF0EA;
  border-radius: 8px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #E8C9A0;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #D4956A;
  }
}

.switch-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #B8A090;

  a {
    color: #D4956A;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
      color: #C08050;
    }
  }
}
```

- [ ] **Step 5: 验证编译**

Run: `npm run build`
Expected: 构建成功

---

### Task 3: 更新路由 + AppShell

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`

- [ ] **Step 1: 更新路由配置**

编辑 `src/app/app.routes.ts`，添加 login 路径，为所有现有路由添加 AuthGuard：

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: '', loadComponent: () => import('./features/timeline/timeline.component').then(m => m.TimelineComponent), canActivate: [AuthGuard] },
  { path: 'albums', loadComponent: () => import('./features/albums/album-list/album-list.component').then(m => m.AlbumListComponent), canActivate: [AuthGuard] },
  { path: 'albums/:id', loadComponent: () => import('./features/albums/album-detail/album-detail.component').then(m => m.AlbumDetailComponent), canActivate: [AuthGuard] },
  { path: 'trash', loadComponent: () => import('./features/trash/trash.component').then(m => m.TrashComponent), canActivate: [AuthGuard] },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuard] },
  { path: 'photo/:id', loadComponent: () => import('./features/photo-viewer/photo-viewer.component').then(m => m.PhotoViewerComponent), canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 2: 更新 App.ts — 注入 AuthService + Router，控制导航显示**

编辑 `src/app/app.ts`：

```typescript
import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(
    public auth: AuthService,
    public router: Router
  ) {}

  get showNav(): boolean {
    return this.auth.isLoggedIn() && this.router.url !== '/login';
  }
}
```

- [ ] **Step 3: 更新 AppShell 模板 — 根据 showNav 显示导航栏**

编辑 `src/app/app.html`：

```html
<div class="app-shell">
  <main class="main-content">
    <router-outlet />
  </main>

  <nav class="bottom-nav" *ngIf="showNav">
    <a class="nav-item" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
      <span class="nav-icon">📷</span>
      <span class="nav-label">时光轴</span>
    </a>
    <a class="nav-item" routerLink="/albums" routerLinkActive="active">
      <span class="nav-icon">📂</span>
      <span class="nav-label">相册</span>
    </a>
    <a class="nav-item" routerLink="/trash" routerLinkActive="active">
      <span class="nav-icon">🗑️</span>
      <span class="nav-label">回收站</span>
    </a>
    <a class="nav-item" routerLink="/settings" routerLinkActive="active">
      <span class="nav-icon">👤</span>
      <span class="nav-label">设置</span>
    </a>
  </nav>
</div>
```

- [ ] **Step 4: 验证编译**

Run: `npm run build`
Expected: 构建成功

---

### Task 4: 更新 Album 和 Photo 模型 + AlbumService

**Files:**
- Modify: `src/app/core/models/album.model.ts`
- Modify: `src/app/core/models/photo.model.ts`
- Modify: `src/app/core/services/album.service.ts`

- [ ] **Step 1: 精简 Album 模型**

编辑 `src/app/core/models/album.model.ts`，删除 members 导入和字段，新增 ownerId：

```typescript
export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}
```

删除开头的 `import { User } from './user.model';` 和 `members: User[]`。

- [ ] **Step 2: 更新 Photo 模型 — 新增 ownerId**

编辑 `src/app/core/models/photo.model.ts`：

```typescript
export interface Photo {
  id: string;
  albumId: string;
  ownerId: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TrashItem {
  id: string;
  originalAlbumId: string;
  originalAlbumName: string;
  photo: Photo;
  deletedAt: Date;
  expiresAt: Date;
}
```

- [ ] **Step 3: 重写 AlbumService — ownerId 隔离 + 自动注入**

编辑 `src/app/core/services/album.service.ts`：

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Album } from '../models/album.model';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'qalbum_albums';

@Injectable({ providedIn: 'root' })
export class AlbumService {
  private albums: Album[] = this.loadAlbums();
  private albumsSubject = new BehaviorSubject<Album[]>(this.albums);
  albums$ = this.albumsSubject.asObservable();

  constructor(private authService: AuthService) {}

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
```

注意：`getAlbums()` 用了一个 Observable factory 来每次 emit filtered list。更简洁的写法是用 `map` 操作符，但 Angular 22 下这样也能跑通。

- [ ] **Step 4: 验证编译**

Run: `npm run build`
Expected: 构建成功（可能有 callers 报错，后续 Task 修复）

---

### Task 5: 更新 PhotoService + TrashService — ownerId 隔离

**Files:**
- Modify: `src/app/core/services/photo.service.ts`
- Modify: `src/app/core/services/trash.service.ts`

- [ ] **Step 1: 重写 PhotoService**

编辑 `src/app/core/services/photo.service.ts`：

```typescript
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

  private get filteredPhotos(): Photo[] {
    const user = this.authService.getCurrentUser();
    if (!user) return [];
    return this.photos.filter(p => p.ownerId === user.id);
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
```

- [ ] **Step 2: 重写 TrashService — ownerId 隔离**

编辑 `src/app/core/services/trash.service.ts`：

```typescript
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
```

- [ ] **Step 3: 验证编译**

Run: `npm run build`
Expected: 构建成功（或仅有 SettingsComponent 相关错误）

---

### Task 6: 重写 SettingsComponent — 去掉成员管理，增加空间统计

**Files:**
- Modify: `src/app/features/settings/settings.component.ts`
- Modify: `src/app/features/settings/settings.component.html`
- Modify: `src/app/features/settings/settings.component.scss`

- [ ] **Step 1: 重写 SettingsComponent TypeScript**

编辑 `src/app/features/settings/settings.component.ts`：

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlbumService } from '../../core/services/album.service';
import { PhotoService } from '../../core/services/photo.service';
import { User } from '../../core/models/user.model';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FileSizePipe],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  totalAlbums = 0;
  totalPhotos = 0;
  totalSize = 0;

  showProfileForm = false;
  editName = '';
  editEmail = '';

  showPasswordForm = false;
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = false;

  constructor(
    private authService: AuthService,
    private albumService: AlbumService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (u) {
        this.editName = u.name;
        this.editEmail = u.email;
      }
    });
    this.albumService.getAlbums().subscribe(a => this.totalAlbums = a.length);
    this.photoService.getPhotos().subscribe(p => {
      this.totalPhotos = p.length;
      this.totalSize = p.reduce((sum, photo) => sum + photo.size, 0);
    });
  }

  saveProfile(): void {
    if (!this.editName.trim() || !this.editEmail.trim()) return;
    this.authService.updateProfile(this.editName.trim(), this.editEmail.trim())
      .subscribe(() => {
        this.showProfileForm = false;
      });
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = false;
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = '请填写所有密码字段';
      return;
    }
    if (this.newPassword.length < 4) {
      this.passwordError = '新密码至少 4 位';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = '两次密码不一致';
      return;
    }
    this.authService.changePassword(this.oldPassword, this.newPassword)
      .subscribe(success => {
        if (success) {
          this.passwordSuccess = true;
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          setTimeout(() => this.showPasswordForm = false, 1500);
        } else {
          this.passwordError = '旧密码错误';
        }
      });
  }

  logout(): void {
    if (!confirm('确定退出登录？')) return;
    this.authService.logout();
  }
}
```

- [ ] **Step 2: 重写 SettingsComponent 模板**

编辑 `src/app/features/settings/settings.component.html`：

```html
<div class="settings-page" *ngIf="currentUser">
  <div class="user-card">
    <div class="user-avatar">{{ currentUser.name[0] }}</div>
    <div class="user-info">
      <div class="user-name">{{ currentUser.name }}</div>
      <div class="user-email">{{ currentUser.email }}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">空间概览</div>
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{{ totalAlbums }}</span>
        <span class="stat-label">相册</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ totalPhotos }}</span>
        <span class="stat-label">照片</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ totalSize | fileSize }}</span>
        <span class="stat-label">已用空间</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">设置</div>

    <div class="menu-item" (click)="showProfileForm = !showProfileForm">
      <span class="menu-icon">👤</span>
      <span class="menu-label">个人资料</span>
      <span class="menu-arrow">›</span>
    </div>

    <div class="menu-item" (click)="showPasswordForm = !showPasswordForm">
      <span class="menu-icon">🔑</span>
      <span class="menu-label">修改密码</span>
      <span class="menu-arrow">›</span>
    </div>
  </div>

  <div class="inline-form" *ngIf="showProfileForm">
    <input type="text" placeholder="姓名" [(ngModel)]="editName">
    <input type="email" placeholder="邮箱" [(ngModel)]="editEmail">
    <div class="form-actions">
      <button class="btn-cancel" (click)="showProfileForm = false">取消</button>
      <button class="btn-confirm" (click)="saveProfile()">保存</button>
    </div>
  </div>

  <div class="inline-form" *ngIf="showPasswordForm">
    <div class="success-msg" *ngIf="passwordSuccess">✅ 密码修改成功</div>
    <div class="error-msg" *ngIf="passwordError">{{ passwordError }}</div>
    <input type="password" placeholder="旧密码" [(ngModel)]="oldPassword">
    <input type="password" placeholder="新密码" [(ngModel)]="newPassword">
    <input type="password" placeholder="确认新密码" [(ngModel)]="confirmPassword">
    <div class="form-actions">
      <button class="btn-cancel" (click)="showPasswordForm = false">取消</button>
      <button class="btn-confirm" (click)="changePassword()">修改</button>
    </div>
  </div>

  <div class="section logout-section">
    <div class="menu-item danger" (click)="logout()">
      <span class="menu-icon">🚪</span>
      <span class="menu-label">退出登录</span>
    </div>
  </div>
</div>
```

- [ ] **Step 3: 更新 SettingsComponent 样式**

编辑 `src/app/features/settings/settings.component.scss`：

```scss
.settings-page {
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #FFFCF8;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #E8C9A0;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #5A4A3A;
}

.user-email {
  font-size: 12px;
  color: #B8A090;
  margin-top: 2px;
}

.section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #B8A090;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 4px 8px 4px;
}

.stats-row {
  display: flex;
  gap: 8px;
}

.stat-item {
  flex: 1;
  background: #FFFCF8;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #5A4A3A;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #B8A090;
  margin-top: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #FFFCF8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  &:hover {
    background: #FFF8F0;
  }

  &.danger:hover {
    background: #FDF0EA;
  }

  .menu-icon {
    font-size: 18px;
    margin-right: 12px;
  }

  .menu-label {
    flex: 1;
    font-size: 14px;
    color: #5A4A3A;
  }

  .menu-badge {
    font-size: 11px;
    color: #B8A090;
    background: #F5EDE4;
    padding: 2px 8px;
    border-radius: 10px;
    margin-right: 8px;

    &.danger {
      background: #FDF0EA;
      color: #D47A5A;
    }
  }

  .menu-arrow {
    color: #D0C0B0;
    font-size: 18px;
  }
}

.inline-form {
  background: #FFFCF8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #F0E6DA;
    border-radius: 8px;
    background: #FFF8F0;
    font-size: 13px;
    color: #5A4A3A;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 8px;

    &:focus {
      border-color: #E8C9A0;
    }
  }
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;

  button {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
}

.btn-cancel {
  background: #F5EDE4;
  color: #B8A090;
}

.btn-confirm {
  background: #E8C9A0;
  color: white;
}

.success-msg {
  color: #6BAF6B;
  font-size: 12px;
  text-align: center;
  margin-bottom: 8px;
}

.error-msg {
  color: #D47A5A;
  font-size: 12px;
  text-align: center;
  margin-bottom: 8px;
}

.logout-section {
  margin-top: 24px;
}
```

- [ ] **Step 4: 验证编译**

Run: `npm run build`
Expected: 构建成功

---

### Task 7: 修复受影响的调用方

**Files:**
- Modify: `src/app/features/albums/album-list/album-list.component.ts`
- Modify: `src/app/shared/components/upload-dialog/upload-dialog.component.ts`
- Delete: `src/app/core/guards/admin.guard.ts`

- [ ] **Step 1: 修复 AlbumListComponent — createAlbum 不再传 user**

编辑 `src/app/features/albums/album-list/album-list.component.ts`，修改 `createAlbum` 方法：

删除 `import { AuthService } from '../../../core/services/auth.service';`

删除构造函数中的 `private authService: AuthService`

将 `createAlbum` 方法改为：

```typescript
createAlbum(): void {
  if (!this.newAlbumName.trim()) return;
  this.albumService.createAlbum(this.newAlbumName, this.newAlbumDesc)
    .subscribe(() => {
      this.showCreateDialog = false;
      this.newAlbumName = '';
      this.newAlbumDesc = '';
    });
}
```

- [ ] **Step 2: 修复 UploadDialogComponent — uploadPhotos 不再传 userId**

编辑 `src/app/shared/components/upload-dialog/upload-dialog.component.ts`，修改三处：

删除 `import { AuthService } from '../../../core/services/auth.service';`

从构造函数参数中删除 `private authService: AuthService`

将 `onUpload` 方法改为：

```typescript
onUpload(): void {
  if (!this.selectedAlbumId) return;
  this.photoService.uploadPhotos(this.selectedFiles, this.selectedAlbumId)
    .subscribe(() => {
      this.uploaded.emit();
      this.onClose();
    });
}
```

- [ ] **Step 3: 删除 AdminGuard**

```bash
rm src/app/core/guards/admin.guard.ts
```

- [ ] **Step 4: 验证编译**

Run: `npm run build`
Expected: 构建成功，无错误

---

### Task 8: 修复 Timeline — 空间名称个性化

**Files:**
- Modify: `src/app/features/timeline/timeline.component.ts`

- [ ] **Step 1: 让空间名称显示用户信息**

编辑 `src/app/features/timeline/timeline.component.ts`，注入 AuthService，将 `spaceName` 改为计算自当前用户：

```typescript
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
  showUpload = false;

  constructor(
    private photoService: PhotoService,
    private albumService: AlbumService,
    private authService: AuthService,
  ) {}

  get spaceName(): string {
    return this.authService.getCurrentUser()?.name + ' 的相册' || '我的相册';
  }
  // ... rest stays the same
```

保留其余方法（ngOnInit、groupByMonth、onUploaded）不变。

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 构建成功

---

### Task 9: 更新 README + CLAUDE.md

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新 README.md**

将 README 从"家庭云相册"描述更新为"私有云相册"。主要变更：
- 项目描述改为"私有云相册 Web 应用"
- 删除角色权限表格
- 删除成员管理相关描述
- 设置页描述改为个人设置 + 空间统计
- 更新"技术栈"等部分为最新

- [ ] **Step 2: 更新 CLAUDE.md**

同步 CLAUDE.md 中的数据模型描述：
- User 模型：删除 role/status，新增 password
- Album 模型：删除 members，新增 ownerId
- Photo 模型：新增 ownerId
- 服务职责表更新 AuthService 描述
- 删除 AdminGuard 条目

- [ ] **Step 3: 验证构建 + 运行测试**

```bash
npm run build
npm test
```

Expected: 构建成功，测试通过

---

### 自审检查

完成所有任务后，对照 spec 逐项确认：

- [x] User 模型删除 role/status，新增 password
- [x] AuthService 密码登录/注册，删除审批逻辑
- [x] AuthGuard 替换 AdminGuard
- [x] LoginComponent 邮箱+密码表单
- [x] 路由全部加 AuthGuard
- [x] Album 模型删除 members，新增 ownerId
- [x] Photo 模型新增 ownerId
- [x] AlbumService ownerId 过滤
- [x] PhotoService ownerId 过滤
- [x] TrashService ownerId 过滤
- [x] 设置页去掉成员管理，增加空间统计
- [x] 导航栏在登录页隐藏
- [x] 旧 localStorage 数据自动清除
- [x] 删除 AdminGuard
