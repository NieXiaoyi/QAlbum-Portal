# 家庭云相册 (QAlbum-Portal) 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个面向核心小家庭的家庭云相册 Web 应用，支持桌面端和移动端浏览器

**Architecture:** Angular 独立组件架构，每个页面/功能模块对应一个独立 feature 模块，共享组件和核心服务分离。数据层使用内存模拟 + localStorage 持久化，后续可替换为真实 API

**Tech Stack:** Angular 19+, Angular CLI, TypeScript, SCSS, Angular Router, Angular Forms

**注意：** 本计划包含数据模型和内存 mock 服务层，后续对接真实 API 时只需替换 Service 实现

---

## 文件结构

```
src/
  app/
    core/
      models/
        user.model.ts
        album.model.ts
        photo.model.ts
      services/
        auth.service.ts          # 认证 & 成员管理
        album.service.ts         # 相册 CRUD
        photo.service.ts         # 照片 CRUD、移动
        trash.service.ts         # 回收站
      guards/
        admin.guard.ts           # 管理员路由守卫
    shared/
      components/
        photo-grid/
          photo-grid.component.ts      # 照片网格（复用）
        confirm-dialog/
          confirm-dialog.component.ts   # 确认弹窗
        view-toggle/
          view-toggle.component.ts      # 列表/平铺切换
        upload-dialog/
          upload-dialog.component.ts    # 上传照片弹窗
        move-dialog/
          move-dialog.component.ts      # 移动照片弹窗
      pipes/
        time-ago.pipe.ts               # 相对时间
        file-size.pipe.ts              # 文件大小格式化
    features/
      timeline/
        timeline.component.ts          # 时光轴首页
      albums/
        album-list/
          album-list.component.ts      # 相册列表页
        album-detail/
          album-detail.component.ts    # 相册详情页
      trash/
        trash.component.ts             # 回收站
      settings/
        settings.component.ts          # 设置主页
        member-list/
          member-list.component.ts     # 成员列表
        member-approval/
          member-approval.component.ts # 审核申请（管理员）
      photo-viewer/
        photo-viewer.component.ts      # 大图查看
    app.component.ts
    app.routes.ts
  styles/
    _variables.scss                    # 主题变量
    _mixins.scss                       # 响应式 mixin
  index.html
```

---

## Task 1: 项目脚手架 & 全局样式

**Files:**
- Create: `angular.json` (由 CLI 生成)
- Create: `src/styles/_variables.scss`
- Create: `src/styles/_mixins.scss`
- Modify: `src/styles.scss`
- Modify: `src/index.html`

### Step 1: 安装 Angular CLI 并创建项目

Run:
```bash
npm install -g @angular/cli
cd /root/Code/QAlbum/QAlbum-Portal
ng new qalbum --directory=. --routing --style=scss --ssr=false --skip-git --skip-install
npm install
```

Expected: Angular 项目文件生成，包含 src/app/ 目录和 app.routes.ts

### Step 2: 创建主题变量文件

Write `src/styles/_variables.scss`:

```scss
// ===== 温暖家庭风主题 =====

// Colors
$color-bg: #FFFCF8;
$color-bg-card: #FFF8F0;
$color-bg-muted: #F5EDE4;
$color-bg-subtle: #F0E6DA;
$color-accent: #E8C9A0;
$color-accent-dark: #D4956A;
$color-text: #5A4A3A;
$color-text-muted: #B8A090;
$color-text-light: #D4A574;
$color-danger: #D47A5A;
$color-danger-bg: #FFF0E8;

// Border radius
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 12px;
$radius-xl: 16px;

// Shadows
$shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
$shadow-elevated: 0 4px 20px rgba(0, 0, 0, 0.1);

// Font
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$font-size-xs: 11px;
$font-size-sm: 12px;
$font-size-base: 13px;
$font-size-md: 14px;
$font-size-lg: 18px;
$font-size-xl: 20px;

// Breakpoints
$bp-mobile: 768px;
$bp-tablet: 1200px;
```

### Step 3: 创建响应式 mixin

Write `src/styles/_mixins.scss`:

```scss
@use 'variables' as *;

@mixin mobile {
  @media (max-width: #{$bp-mobile - 1px}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: $bp-mobile) and (max-width: #{$bp-tablet - 1px}) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: $bp-tablet) {
    @content;
  }
}

@mixin responsive-grid($mobile-cols: 3, $tablet-cols: 5, $desktop-cols: 7) {
  display: grid;
  grid-template-columns: repeat($mobile-cols, 1fr);
  gap: 4px;

  @include tablet {
    grid-template-columns: repeat($tablet-cols, 1fr);
  }

  @include desktop {
    grid-template-columns: repeat($desktop-cols, 1fr);
  }
}
```

### Step 4: 更新全局样式

Replace `src/styles.scss`:

```scss
@use 'styles/variables' as *;
@use 'styles/mixins' as *;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: $font-family;
  font-size: $font-size-base;
  color: $color-text;
  background: $color-bg;
  -webkit-font-smoothing: antialiased;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

input {
  font-family: inherit;
  border: none;
  outline: none;
}

// Scrollbar
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: $color-bg-muted;
  border-radius: 2px;
}
```

### Step 5: 更新 index.html 标题

Edit `src/index.html`: 修改 `<title>` 为 `QAlbum - 家庭相册`

### Step 6: 提交

```bash
git add -A
git commit -m "feat: scaffold Angular project with warm family theme"
```

---

## Task 2: 数据模型

**Files:**
- Create: `src/app/core/models/user.model.ts`
- Create: `src/app/core/models/album.model.ts`
- Create: `src/app/core/models/photo.model.ts`

### Step 1: 用户模型

Write `src/app/core/models/user.model.ts`:

```typescript
export type UserRole = 'admin' | 'member';

export type MemberStatus = 'active' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: MemberStatus;
  joinedAt: Date;
}
```

### Step 2: 相册模型

Write `src/app/core/models/album.model.ts`:

```typescript
import { User } from './user.model';

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
  members: User[];
}
```

### Step 3: 照片模型

Write `src/app/core/models/photo.model.ts`:

```typescript
export interface Photo {
  id: string;
  albumId: string;
  fileName: string;
  url: string;            // data URL or blob URL for mock
  thumbnailUrl?: string;
  size: number;           // bytes
  width?: number;
  height?: number;
  uploadedAt: Date;
  uploadedBy: string;     // user ID
}

export interface TrashItem {
  id: string;
  originalAlbumId: string;
  originalAlbumName: string;
  photo: Photo;
  deletedAt: Date;
  expiresAt: Date;        // deletedAt + 30 days
}
```

### Step 4: 提交

```bash
git add src/app/core/models/
git commit -m "feat: add data models for user, album, photo"
```

---

## Task 3: 核心服务

**Files:**
- Create: `src/app/core/services/auth.service.ts`
- Create: `src/app/core/services/album.service.ts`
- Create: `src/app/core/services/photo.service.ts`
- Create: `src/app/core/services/trash.service.ts`

这些服务使用内存数据 + localStorage 持久化，模拟后端行为。

### Step 1: AuthService

Write `src/app/core/services/auth.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole, MemberStatus } from '../models/user.model';

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
    // Seed with default admin
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

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
```

### Step 2: AlbumService

Write `src/app/core/services/album.service.ts`:

```typescript
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
```

### Step 3: PhotoService

Write `src/app/core/services/photo.service.ts`:

```typescript
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
```

### Step 4: TrashService

Write `src/app/core/services/trash.service.ts`:

```typescript
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
    // Filter out expired items
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
```

### Step 5: AdminGuard

Write `src/app/core/guards/admin.guard.ts`:

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isAdmin()) return true;
    this.router.navigate(['/']);
    return false;
  }
}
```

### Step 6: 提交

```bash
git add src/app/core/
git commit -m "feat: add core services with localStorage persistence"
```

---

## Task 4: 共享组件

**Files:**
- Create: `src/app/shared/components/view-toggle/view-toggle.component.ts`
- Create: `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- Create: `src/app/shared/components/upload-dialog/upload-dialog.component.ts`
- Create: `src/app/shared/components/move-dialog/move-dialog.component.ts`
- Create: `src/app/shared/pipes/time-ago.pipe.ts`
- Create: `src/app/shared/pipes/file-size.pipe.ts`

### Step 1: ViewToggleComponent

Write `src/app/shared/components/view-toggle/view-toggle.component.ts`:

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ViewMode = 'list' | 'grid';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  template: `
    <div class="toggle">
      <button
        [class.active]="mode === 'list'"
        (click)="switch('list')"
        class="toggle-btn"
      >☰ 列表</button>
      <button
        [class.active]="mode === 'grid'"
        (click)="switch('grid')"
        class="toggle-btn"
      >▦ 平铺</button>
    </div>
  `,
  styles: [`
    .toggle {
      display: flex;
      background: #F5EDE4;
      border-radius: 10px;
      padding: 3px;
      gap: 2px;
    }
    .toggle-btn {
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #B8A090;
      transition: all 0.2s;
    }
    .toggle-btn.active {
      background: white;
      color: #D4956A;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
  `]
})
export class ViewToggleComponent {
  @Input() mode: ViewMode = 'grid';
  @Output() modeChange = new EventEmitter<ViewMode>();

  switch(m: ViewMode): void {
    this.mode = m;
    this.modeChange.emit(m);
    localStorage.setItem('qalbum_view_mode', m);
  }
}
```

### Step 2: ConfirmDialogComponent

Write `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`:

```typescript
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>{{ data.title }}</h3>
        <p>{{ data.message }}</p>
        <div class="actions">
          <button class="btn-cancel" (click)="onCancel()">
            {{ data.cancelText || '取消' }}
          </button>
          <button
            class="btn-confirm"
            [class.danger]="data.danger"
            (click)="onConfirm()"
          >
            {{ data.confirmText || '确定' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .dialog {
      background: #FFFCF8; border-radius: 16px;
      padding: 24px; max-width: 320px; width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    h3 { font-size: 16px; color: #5A4A3A; margin-bottom: 8px; }
    p { font-size: 13px; color: #B8A090; line-height: 1.5; margin-bottom: 20px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    button {
      padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
    }
    .btn-cancel { background: #F5EDE4; color: #B8A090; }
    .btn-confirm { background: #E8C9A0; color: white; }
    .btn-confirm.danger { background: #D47A5A; }
  `]
})
export class ConfirmDialogComponent {
  constructor(@Inject('CONFIRM_DATA') public data: ConfirmDialogData) {}

  private resolve!: (result: boolean) => void;
  promise = new Promise<boolean>(resolve => this.resolve = resolve);

  onConfirm(): void { this.resolve(true); }
  onCancel(): void { this.resolve(false); }
}
```

### Step 3: UploadDialogComponent

Write `src/app/shared/components/upload-dialog/upload-dialog.component.ts`:

```typescript
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlbumService } from '../../../core/services/album.service';
import { Album } from '../../../core/models/album.model';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onClose()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>上传照片</h3>

        <div class="drop-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
          <div class="drop-icon">📤</div>
          <p>点击选择照片</p>
          <span class="hint">或拖拽照片到此处</span>
          <input
            type="file"
            multiple
            accept="image/*"
            (change)="onFilesSelected($event)"
            #fileInput
            style="display:none"
          >
          <button class="select-btn" (click)="fileInput.click()">选择文件</button>
        </div>

        <div class="album-select" *ngIf="albums.length">
          <label>保存到相册</label>
          <select [(ngModel)]="selectedAlbumId">
            <option *ngFor="let a of albums" [value]="a.id">{{ a.name }}</option>
          </select>
        </div>

        <div class="preview" *ngIf="previews.length">
          <span class="preview-label">已选择 {{ previews.length }} 张照片</span>
          <div class="thumbnails">
            <img *ngFor="let p of previews" [src]="p" class="thumb">
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" (click)="onClose()">取消</button>
          <button class="btn-confirm" (click)="onUpload()" [disabled]="!selectedFiles.length">
            开始上传
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #FFFCF8; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto; }
    h3 { font-size: 18px; color: #5A4A3A; text-align: center; margin-bottom: 16px; }
    .drop-zone { border: 2px dashed #E8D5C0; border-radius: 12px; padding: 32px; text-align: center; background: #FFF8F0; }
    .drop-icon { font-size: 36px; margin-bottom: 8px; }
    .hint { display: block; font-size: 11px; color: #B8A090; margin-top: 4px; }
    .select-btn { margin-top: 12px; padding: 8px 20px; background: #E8C9A0; color: white; border-radius: 8px; font-size: 13px; }
    .album-select { margin-top: 12px; }
    .album-select label { font-size: 13px; color: #5A4A3A; display: block; margin-bottom: 6px; }
    .album-select select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #F0E6DA; background: #FFF8F0; font-size: 13px; color: #5A4A3A; }
    .preview { margin-top: 12px; }
    .preview-label { font-size: 12px; color: #B8A090; display: block; margin-bottom: 6px; }
    .thumbnails { display: flex; gap: 4px; flex-wrap: wrap; }
    .thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
    .actions { display: flex; gap: 8px; margin-top: 16px; }
    .btn-cancel { flex: 1; padding: 10px; border-radius: 8px; background: #F5EDE4; color: #B8A090; font-size: 13px; font-weight: 600; }
    .btn-confirm { flex: 1; padding: 10px; border-radius: 8px; background: #E8C9A0; color: white; font-size: 13px; font-weight: 600; }
    .btn-confirm:disabled { opacity: 0.5; }
  `]
})
export class UploadDialogComponent {
  @Output() uploaded = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  albums: Album[] = [];
  selectedAlbumId: string = '';
  selectedFiles: File[] = [];
  previews: string[] = [];

  constructor(private albumService: AlbumService) {
    this.albumService.getAlbums().subscribe(a => {
      this.albums = a;
      if (a.length) this.selectedAlbumId = a[0].id;
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  private addFiles(files: File[]): void {
    this.selectedFiles = files;
    this.previews = files.map(f => URL.createObjectURL(f));
  }

  onUpload(): void {
    // Emit — parent handles actual upload via PhotoService
    this.uploaded.emit();
    this.onClose();
  }

  onClose(): void { this.close.emit(); }
}
```

### Step 4: MoveDialogComponent

Write `src/app/shared/components/move-dialog/move-dialog.component.ts`:

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Album } from '../../../core/models/album.model';

@Component({
  selector: 'app-move-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>移动照片</h3>
        <p class="subtitle">选择 {{ photoCount }} 张照片的目标相册</p>

        <div class="album-list">
          <div
            *ngFor="let album of albums"
            class="album-item"
            [class.selected]="selectedAlbumId === album.id"
            (click)="selectedAlbumId = album.id"
          >
            <span>📁</span>
            <span class="name">{{ album.name }}</span>
            <span class="count">{{ album.photoCount }} 张</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" (click)="onCancel()">取消</button>
          <button class="btn-confirm" (click)="onConfirm()" [disabled]="!selectedAlbumId">
            移动到此处
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #FFFCF8; border-radius: 16px; padding: 24px; max-width: 360px; width: 90%; }
    h3 { font-size: 18px; color: #5A4A3A; text-align: center; }
    .subtitle { font-size: 12px; color: #B8A090; text-align: center; margin: 4px 0 16px; }
    .album-list { display: flex; flex-direction: column; gap: 8px; }
    .album-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; background: #FFF8F0; cursor: pointer; transition: all 0.2s; }
    .album-item:hover { background: #F5EDE4; }
    .album-item.selected { background: #E8C9A0; color: white; }
    .name { flex: 1; font-size: 13px; }
    .count { font-size: 12px; opacity: 0.7; }
    .actions { display: flex; gap: 8px; margin-top: 16px; }
    .btn-cancel { flex: 1; padding: 10px; border-radius: 8px; background: #F5EDE4; color: #B8A090; font-size: 13px; }
    .btn-confirm { flex: 1; padding: 10px; border-radius: 8px; background: #E8C9A0; color: white; font-size: 13px; font-weight: 600; }
    .btn-confirm:disabled { opacity: 0.5; }
  `]
})
export class MoveDialogComponent {
  @Input() albums: Album[] = [];
  @Input() photoCount: number = 1;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  selectedAlbumId: string = '';

  onConfirm(): void {
    if (this.selectedAlbumId) this.confirm.emit(this.selectedAlbumId);
  }
  onCancel(): void { this.cancel.emit(); }
}
```

### Step 5: Pipes

Write `src/app/shared/pipes/time-ago.pipe.ts`:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
    return `${Math.floor(diffDays / 365)} 年前`;
  }
}
```

Write `src/app/shared/pipes/file-size.pipe.ts`:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileSize', standalone: true })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
```

### Step 6: 提交

```bash
git add src/app/shared/
git commit -m "feat: add shared components and pipes"
```

---

## Task 5: 时光轴首页

**Files:**
- Create: `src/app/features/timeline/timeline.component.ts`
- Create: `src/app/features/timeline/timeline.component.html`
- Create: `src/app/features/timeline/timeline.component.scss`

### Step 1: 创建时光轴组件

Write `src/app/features/timeline/timeline.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PhotoService } from '../../core/services/photo.service';
import { AlbumService } from '../../core/services/album.service';
import { AuthService } from '../../core/services/auth.service';
import { Photo } from '../../core/models/photo.model';
import { Album } from '../../core/models/album.model';
import { UploadDialogComponent } from '../../shared/components/upload-dialog/upload-dialog.component';

interface PhotoGroup {
  label: string;
  date: Date;
  photos: Photo[];
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, RouterModule, UploadDialogComponent, DatePipe],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
  photoGroups: PhotoGroup[] = [];
  totalPhotos = 0;
  spaceName = '我们的家';
  showUpload = false;
  albums: Album[] = [];

  constructor(
    private photoService: PhotoService,
    private albumService: AlbumService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.albumService.getAlbums().subscribe(a => this.albums = a);
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
    // Refresh photos
    this.ngOnInit();
  }
}
```

### Step 2: 时光轴模板

Write `src/app/features/timeline/timeline.component.html`:

```html
<div class="timeline">
  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="space-name">{{ spaceName }}</h1>
      <span class="photo-count">共 {{ totalPhotos }} 张照片</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" routerLink="/settings">👤</button>
      <button class="upload-btn" (click)="showUpload = true">+</button>
    </div>
  </div>

  <!-- Photo timeline groups -->
  <div class="groups">
    <div class="group" *ngFor="let group of photoGroups">
      <div class="group-divider">
        <span class="group-label">{{ group.label }}</span>
      </div>
      <div class="photo-grid">
        <a
          class="photo-item"
          *ngFor="let photo of group.photos"
          [routerLink]="['/photo', photo.id]"
        >
          <img [src]="photo.url" [alt]="photo.fileName" loading="lazy">
        </a>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div class="empty-state" *ngIf="totalPhotos === 0">
    <div class="empty-icon">📸</div>
    <p>还没有照片</p>
    <span>点击右上角 + 上传第一张照片</span>
  </div>
</div>

<app-upload-dialog
  *ngIf="showUpload"
  (uploaded)="onUploaded()"
  (close)="showUpload = false"
/>
```

### Step 3: 时光轴样式

Write `src/app/features/timeline/timeline.component.scss`:

```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.timeline {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .space-name {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-accent-dark;
  }

  .photo-count {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $color-bg-subtle;
    font-size: 16px;
  }

  .upload-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: $color-accent;
    color: white;
    font-size: 20px;
    font-weight: bold;
  }
}

.group {
  margin-bottom: 16px;
}

.group-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .group-label {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-accent-dark;
    white-space: nowrap;
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $color-bg-subtle;
  }
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;

  @include tablet { grid-template-columns: repeat(4, 1fr); }
  @include desktop { grid-template-columns: repeat(6, 1fr); }
}

.photo-item {
  aspect-ratio: 1;
  border-radius: $radius-sm;
  overflow: hidden;
  background: $color-bg-muted;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 64px 16px;
  color: $color-text-muted;

  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  p { font-size: 16px; color: $color-text; margin-bottom: 4px; }
  span { font-size: 13px; }
}
```

### Step 4: 提交

```bash
git add src/app/features/timeline/
git commit -m "feat: add photo timeline page"
```

---

## Task 6: 相册页面

**Files:**
- Create: `src/app/features/albums/album-list/album-list.component.ts`
- Create: `src/app/features/albums/album-list/album-list.component.html`
- Create: `src/app/features/albums/album-list/album-list.component.scss`
- Create: `src/app/features/albums/album-detail/album-detail.component.ts`
- Create: `src/app/features/albums/album-detail/album-detail.component.html`
- Create: `src/app/features/albums/album-detail/album-detail.component.scss`

### Step 1: 相册列表组件

Write `src/app/features/albums/album-list/album-list.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlbumService } from '../../../core/services/album.service';
import { AuthService } from '../../../core/services/auth.service';
import { Album } from '../../../core/models/album.model';
import { ViewToggleComponent, ViewMode } from '../../../shared/components/view-toggle/view-toggle.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-album-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ViewToggleComponent],
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent implements OnInit {
  albums: Album[] = [];
  viewMode: ViewMode = (localStorage.getItem('qalbum_view_mode') as ViewMode) || 'grid';
  showCreateDialog = false;
  newAlbumName = '';
  newAlbumDesc = '';

  constructor(
    private albumService: AlbumService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.albumService.getAlbums().subscribe(a => this.albums = a);
  }

  createAlbum(): void {
    if (!this.newAlbumName.trim()) return;
    const user = this.authService['currentUserSubject'].value;
    if (!user) return;
    this.albumService.createAlbum(this.newAlbumName, this.newAlbumDesc, user)
      .subscribe(() => {
        this.showCreateDialog = false;
        this.newAlbumName = '';
        this.newAlbumDesc = '';
      });
  }

  deleteAlbum(id: string): void {
    if (confirm('确定删除这个相册？照片将移入回收站')) {
      this.albumService.deleteAlbum(id).subscribe();
    }
  }
}
```

### Step 2: 相册列表模板

Write `src/app/features/albums/album-list/album-list.component.html`:

```html
<div class="album-list-page">
  <div class="header">
    <h2>相册</h2>
    <div class="header-actions">
      <app-view-toggle [(mode)]="viewMode" />
      <button class="create-btn" (click)="showCreateDialog = true">+</button>
    </div>
  </div>

  <!-- List mode -->
  <div class="list-mode" *ngIf="viewMode === 'list'">
    <div class="album-row" *ngFor="let album of albums" [routerLink]="['/albums', album.id]">
      <div class="album-cover">
        <div class="cover-placeholder">📁</div>
        <span class="photo-badge">{{ album.photoCount }}</span>
      </div>
      <div class="album-info">
        <div class="album-name">{{ album.name }}</div>
        <div class="album-meta">{{ album.createdAt | date:'yyyy 年 M 月' }} · {{ album.photoCount }} 张</div>
      </div>
      <button class="delete-btn" (click)="$event.stopPropagation(); deleteAlbum(album.id)">🗑️</button>
    </div>
  </div>

  <!-- Grid mode -->
  <div class="grid-mode" *ngIf="viewMode === 'grid'">
    <div class="album-card" *ngFor="let album of albums" [routerLink]="['/albums', album.id]">
      <div class="card-cover">
        <div class="cover-placeholder-lg">📁</div>
        <span class="photo-badge">{{ album.photoCount }} 张</span>
      </div>
      <div class="card-body">
        <div class="card-name">{{ album.name }}</div>
        <div class="card-date">{{ album.createdAt | date:'yyyy 年 M 月' }}</div>
      </div>
    </div>

    <!-- Create card -->
    <div class="create-card" (click)="showCreateDialog = true">
      <div class="create-icon">+</div>
      <span>创建相册</span>
    </div>
  </div>

  <!-- Empty state -->
  <div class="empty-state" *ngIf="!albums.length">
    <p>还没有相册</p>
    <span>点击 + 创建第一个相册</span>
  </div>
</div>

<!-- Create dialog -->
<div class="dialog-overlay" *ngIf="showCreateDialog" (click)="showCreateDialog = false">
  <div class="create-dialog" (click)="$event.stopPropagation()">
    <h3>新建相册</h3>
    <input
      type="text"
      placeholder="相册名称"
      [(ngModel)]="newAlbumName"
      class="name-input"
    >
    <input
      type="text"
      placeholder="描述（选填）"
      [(ngModel)]="newAlbumDesc"
      class="desc-input"
    >
    <div class="dialog-actions">
      <button class="btn-cancel" (click)="showCreateDialog = false">取消</button>
      <button class="btn-confirm" (click)="createAlbum()">创建</button>
    </div>
  </div>
</div>
```

### Step 3: 相册列样式

Write `src/app/features/albums/album-list/album-list.component.scss`:

```scss
@use '../../../../styles/variables' as *;
@use '../../../../styles/mixins' as *;

.album-list-page { padding: 16px; max-width: 1200px; margin: 0 auto; }

.header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  h2 { font-size: $font-size-xl; font-weight: 700; color: $color-accent-dark; }
  .header-actions { display: flex; gap: 8px; align-items: center; }
  .create-btn {
    width: 36px; height: 36px; border-radius: 12px; background: $color-accent;
    color: white; font-size: 20px; font-weight: bold;
  }
}

/* List mode */
.list-mode { display: flex; flex-direction: column; gap: 10px; }
.album-row {
  display: flex; align-items: center; gap: 12px; padding: 10px;
  background: $color-bg-card; border-radius: $radius-md; cursor: pointer;
  &:hover { background: $color-bg-muted; }
}
.album-cover {
  width: 56px; height: 56px; border-radius: $radius-sm; background: $color-bg-muted;
  display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;
}
.cover-placeholder { font-size: 24px; }
.photo-badge {
  position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.4);
  color: white; font-size: 10px; padding: 1px 5px; border-radius: 4px;
}
.album-info { flex: 1; min-width: 0; }
.album-name { font-weight: 600; font-size: 14px; color: $color-text; }
.album-meta { font-size: 11px; color: $color-text-muted; margin-top: 2px; }
.delete-btn { font-size: 14px; opacity: 0.5; &:hover { opacity: 1; } }

/* Grid mode */
.grid-mode {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  @include tablet { grid-template-columns: repeat(3, 1fr); }
  @include desktop { grid-template-columns: repeat(4, 1fr); }
}
.album-card {
  border-radius: $radius-lg; overflow: hidden; background: $color-bg-card;
  box-shadow: $shadow-card; cursor: pointer;
  &:hover { box-shadow: $shadow-elevated; }
}
.card-cover {
  aspect-ratio: 16/10; background: $color-bg-muted;
  display: flex; align-items: center; justify-content: center; position: relative;
  .cover-placeholder-lg { font-size: 36px; }
  .photo-badge { position: absolute; bottom: 8px; right: 8px; }
}
.card-body { padding: 10px; }
.card-name { font-weight: 600; font-size: 14px; color: $color-text; }
.card-date { font-size: 11px; color: $color-text-muted; margin-top: 2px; }

.create-card {
  border-radius: $radius-lg; border: 2px dashed $color-bg-subtle;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px; color: $color-accent-dark; cursor: pointer; min-height: 140px;
  .create-icon { font-size: 28px; margin-bottom: 4px; }
  span { font-size: 13px; }
}

.empty-state { text-align: center; padding: 64px; color: $color-text-muted; p { color: $color-text; } }

/* Dialog */
.dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex;
  align-items: center; justify-content: center; z-index: 1000;
}
.create-dialog {
  background: $color-bg; border-radius: $radius-xl; padding: 24px; max-width: 320px; width: 90%;
  h3 { font-size: 16px; margin-bottom: 16px; color: $color-text; text-align: center; }
  input {
    width: 100%; padding: 10px 12px; border-radius: $radius-sm;
    border: 1px solid $color-bg-subtle; margin-bottom: 8px; font-size: 13px;
    &:focus { border-color: $color-accent; }
  }
}
.dialog-actions { display: flex; gap: 8px; margin-top: 12px; }
.btn-cancel, .btn-confirm { flex: 1; padding: 10px; border-radius: $radius-sm; font-weight: 600; font-size: 13px; }
.btn-cancel { background: $color-bg-muted; color: $color-text-muted; }
.btn-confirm { background: $color-accent; color: white; }
```

### Step 4: 相册详情组件

Write `src/app/features/albums/album-detail/album-detail.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PhotoService } from '../../../core/services/photo.service';
import { AlbumService } from '../../../core/services/album.service';
import { TrashService } from '../../../core/services/trash.service';
import { AuthService } from '../../../core/services/auth.service';
import { Photo } from '../../../core/models/photo.model';
import { Album } from '../../../core/models/album.model';
import { MoveDialogComponent } from '../../../shared/components/move-dialog/move-dialog.component';
import { UploadDialogComponent } from '../../../shared/components/upload-dialog/upload-dialog.component';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MoveDialogComponent, UploadDialogComponent],
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss']
})
export class AlbumDetailComponent implements OnInit {
  album?: Album;
  photos: Photo[] = [];
  selectedPhotoIds = new Set<string>();
  showMoveDialog = false;
  showUpload = false;

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private albumService: AlbumService,
    private trashService: TrashService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.albumService.getAlbum(id).subscribe(a => this.album = a);
    this.photoService.getPhotos(id).subscribe(p => this.photos = p);
    this.selectedPhotoIds.clear();
  }

  toggleSelect(photoId: string): void {
    if (this.selectedPhotoIds.has(photoId)) {
      this.selectedPhotoIds.delete(photoId);
    } else {
      this.selectedPhotoIds.add(photoId);
    }
  }

  deleteSelected(): void {
    if (!this.selectedPhotoIds.size) return;
    if (!confirm('确定删除选中的 ' + this.selectedPhotoIds.size + ' 张照片？')) return;
    const ids = Array.from(this.selectedPhotoIds);
    const albumName = this.album?.name || '未知相册';
    const deletedPhotos = this.photos.filter(p => ids.includes(p.id));
    this.photoService.deletePhotos(ids).subscribe(() => {
      this.trashService.addToTrash(deletedPhotos, albumName);
      this.ngOnInit();
    });
  }

  moveSelected(albumId: string): void {
    const ids = Array.from(this.selectedPhotoIds);
    this.photoService.movePhotos(ids, albumId).subscribe(() => {
      this.showMoveDialog = false;
      this.ngOnInit();
    });
  }
}
```

### Step 5: 相册详情模板

Write `src/app/features/albums/album-detail/album-detail.component.html`:

```html
<div class="album-detail" *ngIf="album">
  <div class="header">
    <a class="back-btn" routerLink="/albums">‹ 返回</a>
    <div class="header-actions">
      <button class="action-btn" (click)="showMoveDialog = selectedPhotoIds.size > 0 && (showMoveDialog = true) " [class.hidden]="!selectedPhotoIds.size">↕ 移动</button>
      <button class="action-btn" (click)="showUpload = true">+ 上传</button>
      <button class="action-btn danger" (click)="deleteSelected()" [class.hidden]="!selectedPhotoIds.size">🗑️ 删除</button>
    </div>
  </div>

  <h2 class="album-title">{{ album.name }}</h2>
  <p class="album-meta">{{ album.photoCount }} 张照片 · {{ album.createdAt | date:'yyyy 年 M 月' }}</p>

  <div class="photo-grid">
    <div
      class="photo-item"
      *ngFor="let photo of photos"
      [class.selected]="selectedPhotoIds.has(photo.id)"
      (click)="toggleSelect(photo.id)"
      [routerLink]="['/photo', photo.id]"
    >
      <img [src]="photo.url" [alt]="photo.fileName" loading="lazy">
      <div class="check" *ngIf="selectedPhotoIds.has(photo.id)">✓</div>
    </div>
  </div>

  <div class="empty-state" *ngIf="!photos.length">
    <p>这个相册还没有照片</p>
    <button class="upload-btn" (click)="showUpload = true">上传照片</button>
  </div>
</div>

<app-move-dialog
  *ngIf="showMoveDialog"
  [albums]="[]"
  [photoCount]="selectedPhotoIds.size"
  (confirm)="moveSelected($event)"
  (cancel)="showMoveDialog = false"
/>

<app-upload-dialog
  *ngIf="showUpload"
  (uploaded)="showUpload = false; ngOnInit()"
  (close)="showUpload = false"
/>
```

### Step 6: 相册详情样式

Write `src/app/features/albums/album-detail/album-detail.component.scss`:

```scss
@use '../../../../styles/variables' as *;
@use '../../../../styles/mixins' as *;

.album-detail { padding: 16px; max-width: 1200px; margin: 0 auto; }

.header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
  .back-btn { color: $color-accent-dark; font-size: 14px; cursor: pointer; }
  .header-actions { display: flex; gap: 6px; }
  .action-btn {
    padding: 6px 12px; border-radius: $radius-sm; background: $color-bg-subtle;
    font-size: 12px; color: $color-text;
    &.danger { background: $color-danger-bg; color: $color-danger; }
    &.hidden { display: none; }
  }
}

.album-title { font-size: $font-size-lg; font-weight: 700; color: $color-text; margin-bottom: 4px; }
.album-meta { font-size: $font-size-sm; color: $color-text-muted; margin-bottom: 12px; }

.photo-grid {
  @include responsive-grid(3, 4, 6);
}

.photo-item {
  aspect-ratio: 1; border-radius: $radius-sm; overflow: hidden;
  background: $color-bg-muted; position: relative; cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; }
  .check {
    position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
    border-radius: 50%; background: $color-accent; color: white;
    display: flex; align-items: center; justify-content: center; font-size: 12px;
  }
  &.selected { outline: 3px solid $color-accent; border-radius: $radius-sm; }
}

.empty-state { text-align: center; padding: 64px; p { color: $color-text-muted; margin-bottom: 12px; } }
.upload-btn { padding: 10px 24px; background: $color-accent; color: white; border-radius: $radius-sm; }
```

### Step 7: 提交

```bash
git add src/app/features/albums/
git commit -m "feat: add album list and detail pages"
```

---

## Task 7: 大图查看页面

**Files:**
- Create: `src/app/features/photo-viewer/photo-viewer.component.ts`
- Create: `src/app/features/photo-viewer/photo-viewer.component.html`
- Create: `src/app/features/photo-viewer/photo-viewer.component.scss`

### Step 1: PhotoViewerComponent

Write `src/app/features/photo-viewer/photo-viewer.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PhotoService } from '../../core/services/photo.service';
import { TrashService } from '../../core/services/trash.service';
import { AlbumService } from '../../core/services/album.service';
import { Photo } from '../../core/models/photo.model';
import { Album } from '../../core/models/album.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.scss']
})
export class PhotoViewerComponent implements OnInit {
  photo?: Photo;
  albumName = '';

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private trashService: TrashService,
    private albumService: AlbumService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.photoService.getPhoto(id).subscribe(p => {
      this.photo = p;
      if (p) {
        this.albumService.getAlbum(p.albumId).subscribe(a => {
          this.albumName = a?.name || '';
        });
      }
    });
  }

  goBack(): void { this.location.back(); }

  deletePhoto(): void {
    if (!this.photo || !confirm('确定删除这张照片？')) return;
    this.trashService.addToTrash([this.photo], this.albumName);
    this.photoService.deletePhotos([this.photo.id]).subscribe(() => this.goBack());
  }
}
```

### Step 2: PhotoViewer 模板

Write `src/app/features/photo-viewer/photo-viewer.component.html`:

```html
<div class="viewer">
  <div class="top-bar">
    <button class="back-btn" (click)="goBack()">‹ 返回</button>
    <span class="date">{{ photo?.uploadedAt | date:'yyyy 年 M 月 d 日' }}</span>
    <div class="actions">
      <button class="action-btn" (click)="deletePhoto()">🗑️</button>
    </div>
  </div>

  <div class="image-container" *ngIf="photo">
    <img [src]="photo.url" [alt]="photo.fileName">
  </div>

  <div class="bottom-bar" *ngIf="photo">
    <span class="file-info">{{ photo.fileName }} · 来自「{{ albumName }}」</span>
  </div>
</div>
```

### Step 3: PhotoViewer 样式

Write `src/app/features/photo-viewer/photo-viewer.component.scss`:

```scss
@use '../../../styles/variables' as *;

.viewer {
  background: #2A2420;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  color: white;

  .back-btn {
    color: white;
    font-size: 14px;
    cursor: pointer;
  }

  .date {
    font-size: 14px;
    opacity: 0.8;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    font-size: 16px;
    cursor: pointer;
  }
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  img {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
  }
}

.bottom-bar {
  text-align: center;
  padding: 12px;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
}
```

### Step 4: 提交

```bash
git add src/app/features/photo-viewer/
git commit -m "feat: add photo viewer page"
```

---

## Task 8: 回收站页面

**Files:**
- Create: `src/app/features/trash/trash.component.ts`
- Create: `src/app/features/trash/trash.component.html`
- Create: `src/app/features/trash/trash.component.scss`

### Step 1: TrashComponent

Write `src/app/features/trash/trash.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrashService } from '../../core/services/trash.service';
import { PhotoService } from '../../core/services/photo.service';
import { TrashItem } from '../../core/models/photo.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

type TrashTab = 'photos' | 'albums';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe, FileSizePipe],
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.scss']
})
export class TrashComponent implements OnInit {
  items: TrashItem[] = [];
  activeTab: TrashTab = 'photos';
  selectedIds = new Set<string>();

  constructor(
    private trashService: TrashService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.trashService.getItems().subscribe(i => this.items = i);
  }

  get photoItems(): TrashItem[] {
    return this.activeTab === 'photos' ? this.items : [];
  }

  restoreItem(id: string): void {
    this.trashService.restoreItem(id).subscribe(photo => {
      this.photoService.movePhotos([photo.id], photo.albumId).subscribe(() => this.ngOnInit());
    });
  }

  restoreAll(): void {
    if (!confirm('恢复所有已删除的照片？')) return;
    this.trashService.restoreAll().subscribe(() => this.ngOnInit());
  }

  emptyTrash(): void {
    if (!confirm('确定清空回收站？此操作不可恢复！')) return;
    this.trashService.emptyTrash().subscribe(() => this.ngOnInit());
  }
}
```

### Step 2: 回收站模板

Write `src/app/features/trash/trash.component.html`:

```html
<div class="trash-page">
  <div class="header">
    <h2>回收站</h2>
    <span class="hint">30 天后自动清理</span>
  </div>

  <div class="tabs">
    <button class="tab" [class.active]="activeTab === 'photos'" (click)="activeTab = 'photos'">
      照片 {{ items.length }}
    </button>
    <button class="tab" [class.active]="activeTab === 'albums'" (click)="activeTab = 'albums'">
      相册 0
    </button>
  </div>

  <div class="items-list">
    <div class="item" *ngFor="let item of photoItems">
      <div class="item-thumb">
        <img [src]="item.photo.url" [alt]="item.photo.fileName">
      </div>
      <div class="item-info">
        <div class="item-name">{{ item.photo.fileName }}</div>
        <div class="item-source">{{ item.deletedAt | timeAgo }}删除 · 来自「{{ item.originalAlbumName }}」</div>
        <div class="item-expiry">{{ item.expiresAt | date:'M 月 d 日' }} 自动永久删除</div>
      </div>
      <button class="restore-btn" (click)="restoreItem(item.id)">恢复</button>
    </div>
  </div>

  <div class="empty-state" *ngIf="!photoItems.length">
    <div class="icon">🗑️</div>
    <p>回收站是空的</p>
  </div>

  <div class="bottom-actions" *ngIf="photoItems.length">
    <button class="btn-restore-all" (click)="restoreAll()">♻️ 恢复全部</button>
    <button class="btn-empty" (click)="emptyTrash()">🗑️ 清空回收站</button>
  </div>
</div>
```

### Step 3: 回收站样式

Write `src/app/features/trash/trash.component.scss`:

```scss
@use '../../../styles/variables' as *;

.trash-page { padding: 16px; max-width: 600px; margin: 0 auto; }

.header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
  h2 { font-size: $font-size-xl; font-weight: 700; color: $color-accent-dark; }
  .hint { font-size: 12px; color: $color-text-muted; }
}

.tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.tab {
  padding: 6px 16px; border-radius: $radius-sm; font-size: 13px; font-weight: 500;
  background: $color-bg-muted; color: $color-text-muted;
  &.active { background: $color-accent; color: white; }
}

.items-list { display: flex; flex-direction: column; gap: 10px; }
.item {
  display: flex; align-items: center; gap: 12px; padding: 10px;
  background: $color-bg-card; border-radius: $radius-md;
}
.item-thumb {
  width: 48px; height: 48px; border-radius: $radius-sm; overflow: hidden; flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 13px; color: $color-text; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-source { font-size: 11px; color: $color-text-light; margin-top: 2px; }
.item-expiry { font-size: 11px; color: $color-text-muted; }
.restore-btn {
  padding: 6px 12px; border-radius: $radius-sm; background: $color-accent;
  color: white; font-size: 12px; white-space: nowrap;
}

.empty-state { text-align: center; padding: 64px; .icon { font-size: 48px; margin-bottom: 12px; } p { color: $color-text-muted; } }

.bottom-actions {
  display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid $color-bg-subtle;
  button { flex: 1; padding: 10px; border-radius: $radius-sm; font-size: 13px; font-weight: 500; }
  .btn-restore-all { background: $color-bg-muted; color: $color-text; }
  .btn-empty { background: $color-danger-bg; color: $color-danger; }
}
```

### Step 4: 提交

```bash
git add src/app/features/trash/
git commit -m "feat: add trash page with restore and empty"
```

---

## Task 9: 设置 & 成员管理

**Files:**
- Create: `src/app/features/settings/settings.component.ts`
- Create: `src/app/features/settings/settings.component.html`
- Create: `src/app/features/settings/settings.component.scss`

### Step 1: SettingsComponent

Write `src/app/features/settings/settings.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlbumService } from '../../core/services/album.service';
import { PhotoService } from '../../core/services/photo.service';
import { User } from '../../core/models/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  users: User[] = [];
  pendingUsers: User[] = [];
  totalPhotos = 0;
  showMemberList = false;
  showApproval = false;
  showProfileEdit = false;
  showPasswordChange = false;

  constructor(
    private authService: AuthService,
    private albumService: AlbumService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.authService.getUsers().subscribe(u => this.users = u);
    this.authService.getPendingUsers().subscribe(u => this.pendingUsers = u);
    this.photoService.getPhotos().subscribe(p => this.totalPhotos = p.length);
  }

  get isAdmin(): boolean { return this.currentUser?.role === 'admin'; }

  approve(id: string): void {
    this.authService.approveMember(id).subscribe(() => this.ngOnInit());
  }

  reject(id: string): void {
    if (!confirm('拒绝该成员的加入申请？')) return;
    this.authService.rejectMember(id).subscribe(() => this.ngOnInit());
  }

  logout(): void {
    if (!confirm('确定退出云空间？')) return;
    this.authService.logout();
  }
}
```

### Step 2: 设置模板

Write `src/app/features/settings/settings.component.html`:

```html
<div class="settings-page">
  <!-- Space info card -->
  <div class="space-card">
    <div class="space-avatar">👨‍👩‍👧</div>
    <div class="space-info">
      <div class="space-name">我们的家</div>
      <div class="space-meta" *ngIf="currentUser">
        {{ currentUser.role === 'admin' ? '管理员' : '成员' }} · {{ users.length }} 位成员 · {{ totalPhotos }} 张照片
      </div>
    </div>
  </div>

  <!-- Member management -->
  <div class="section">
    <div class="section-title">成员管理</div>

    <div class="menu-item" (click)="showMemberList = !showMemberList">
      <span class="menu-icon">👥</span>
      <span class="menu-label">所有成员</span>
      <span class="menu-badge">{{ users.length }} 人</span>
      <span class="menu-arrow">›</span>
    </div>

    <div class="menu-item approval" *ngIf="isAdmin" (click)="showApproval = !showApproval">
      <span class="menu-icon">📩</span>
      <span class="menu-label">审核申请</span>
      <span class="menu-badge danger">{{ pendingUsers.length }} 条</span>
      <span class="menu-arrow">›</span>
    </div>
  </div>

  <!-- Approval list -->
  <div class="approval-list" *ngIf="showApproval && isAdmin">
    <div class="approval-item" *ngFor="let user of pendingUsers">
      <span class="user-name">{{ user.name }}</span>
      <span class="user-email">{{ user.email }}</span>
      <div class="approval-actions">
        <button class="btn-approve" (click)="approve(user.id)">通过</button>
        <button class="btn-reject" (click)="reject(user.id)">拒绝</button>
      </div>
    </div>
    <div class="empty-item" *ngIf="!pendingUsers.length">暂无待审核申请</div>
  </div>

  <!-- Member list -->
  <div class="member-list" *ngIf="showMemberList">
    <div class="member-item" *ngFor="let user of users">
      <span class="member-avatar">{{ user.name[0] }}</span>
      <div class="member-info">
        <span class="member-name">{{ user.name }}</span>
        <span class="member-role">{{ user.role === 'admin' ? '管理员' : '成员' }}</span>
      </div>
      <span class="member-status" [class.active]="user.status === 'active'">
        {{ user.status === 'active' ? '已加入' : '待审核' }}
      </span>
    </div>
  </div>

  <!-- Settings -->
  <div class="section">
    <div class="section-title">设置</div>

    <div class="menu-item" (click)="showProfileEdit = !showProfileEdit">
      <span class="menu-icon">👤</span>
      <span class="menu-label">个人资料</span>
      <span class="menu-arrow">›</span>
    </div>

    <div class="menu-item" (click)="showPasswordChange = !showPasswordChange">
      <span class="menu-icon">🔑</span>
      <span class="menu-label">修改密码</span>
      <span class="menu-arrow">›</span>
    </div>
  </div>

  <!-- Logout -->
  <div class="section logout-section">
    <div class="menu-item danger" (click)="logout()">
      <span class="menu-icon">🚪</span>
      <span class="menu-label">退出云空间</span>
    </div>
  </div>
</div>
```

### Step 3: 设置样式

Write `src/app/features/settings/settings.component.scss`:

```scss
@use '../../../styles/variables' as *;

.settings-page { padding: 16px; max-width: 500px; margin: 0 auto; }

.space-card {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: $color-bg-card; border-radius: $radius-lg; margin-bottom: 16px;
}
.space-avatar {
  width: 48px; height: 48px; border-radius: $radius-lg;
  background: $color-accent; display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.space-info { flex: 1; }
.space-name { font-weight: 600; font-size: 15px; color: $color-text; }
.space-meta { font-size: 12px; color: $color-text-muted; }

.section { margin-bottom: 8px; }
.section-title {
  font-size: 12px; font-weight: 600; color: $color-accent-dark; padding: 8px 4px 4px;
}

.menu-item {
  display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: $radius-md; cursor: pointer;
  &:hover { background: $color-bg-muted; }
  &.approval { background: $color-danger-bg; }
  &.danger { margin-top: 16px; border-top: 1px solid $color-bg-subtle; padding-top: 12px; }
}
.menu-icon { font-size: 18px; }
.menu-label { flex: 1; font-size: 14px; color: $color-text; }
.menu-badge {
  font-size: 12px; color: $color-text-muted;
  &.danger { background: $color-danger; color: white; padding: 2px 8px; border-radius: 10px; }
}
.menu-arrow { color: $color-accent-dark; }
.menu-item.danger .menu-label { color: $color-danger; }

/* Approval list */
.approval-list {
  background: $color-bg; border-radius: $radius-md; padding: 8px; margin-bottom: 8px;
}
.approval-item {
  display: flex; align-items: center; gap: 8px; padding: 8px;
}
.user-name { font-size: 13px; font-weight: 500; color: $color-text; }
.user-email { font-size: 11px; color: $color-text-muted; flex: 1; }
.approval-actions { display: flex; gap: 6px; }
.btn-approve { padding: 4px 12px; border-radius: 6px; background: $color-accent; color: white; font-size: 12px; }
.btn-reject { padding: 4px 12px; border-radius: 6px; background: $color-bg-muted; color: $color-text-muted; font-size: 12px; }
.empty-item { text-align: center; padding: 16px; color: $color-text-muted; font-size: 13px; }

/* Member list */
.member-list { background: $color-bg; border-radius: $radius-md; padding: 8px; margin-bottom: 8px; }
.member-item { display: flex; align-items: center; gap: 10px; padding: 8px; }
.member-avatar {
  width: 36px; height: 36px; border-radius: 50%; background: $color-accent;
  color: white; display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.member-info { flex: 1; }
.member-name { display: block; font-size: 13px; color: $color-text; }
.member-role { display: block; font-size: 11px; color: $color-text-muted; }
.member-status { font-size: 11px; color: $color-text-muted; &.active { color: #7AB87A; } }
```

### Step 4: 提交

```bash
git add src/app/features/settings/
git commit -m "feat: add settings and member management page"
```

---

## Task 10: 路由配置 & App Shell

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.scss`

### Step 1: 配置路由

Replace `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { TimelineComponent } from './features/timeline/timeline.component';
import { AlbumListComponent } from './features/albums/album-list/album-list.component';
import { AlbumDetailComponent } from './features/albums/album-detail/album-detail.component';
import { TrashComponent } from './features/trash/trash.component';
import { SettingsComponent } from './features/settings/settings.component';
import { PhotoViewerComponent } from './features/photo-viewer/photo-viewer.component';

export const routes: Routes = [
  { path: '', component: TimelineComponent },
  { path: 'albums', component: AlbumListComponent },
  { path: 'albums/:id', component: AlbumDetailComponent },
  { path: 'trash', component: TrashComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'photo/:id', component: PhotoViewerComponent },
  { path: '**', redirectTo: '' },
];
```

### Step 2: 更新 AppComponent（底部导航栏）

Replace `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
```

Write `src/app/app.component.html`:

```html
<div class="app-shell">
  <main class="main-content">
    <router-outlet />
  </main>

  <nav class="bottom-nav">
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

Write `src/app/app.component.scss`:

```scss
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-bottom: 72px; // space for bottom nav
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-top: 1px solid $color-bg-subtle;
  padding: 6px 0;
  padding-bottom: max(6px, env(safe-area-inset-bottom));
  z-index: 100;

  @include desktop {
    top: 0;
    bottom: auto;
    padding: 0;
    border-top: none;
    border-bottom: 1px solid $color-bg-subtle;
    justify-content: center;
    gap: 40px;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 16px;
  color: $color-text-muted;
  text-decoration: none;
  transition: color 0.2s;

  @include desktop {
    flex-direction: row;
    gap: 6px;
    padding: 12px 16px;
  }

  &.active {
    color: $color-accent-dark;
  }

  .nav-icon {
    font-size: 20px;

    @include desktop {
      font-size: 16px;
    }
  }

  .nav-label {
    font-size: 11px;
    font-weight: 500;

    @include desktop {
      font-size: 13px;
    }
  }
}
```

### Step 3: 提交

```bash
git add src/app/app.routes.ts src/app/app.component.ts src/app/app.component.html src/app/app.component.scss
git commit -m "feat: add routing and app shell with bottom navigation"
```

---

## Task 11: 构建验证

### Step 1: 构建项目

Run:
```bash
cd /root/Code/QAlbum/QAlbum-Portal && ng build
```

Expected: Build succeeds with no errors. Output in `dist/` directory.

### Step 2: 启动开发服务器验证

Run:
```bash
ng serve --host 0.0.0.0
```

Open http://localhost:4200 in browser. Expected: The app loads with the bottom navigation bar and timeline page visible.

### Step 3: 最终提交

```bash
git add -A
git commit -m "chore: final adjustments and build verification"
```

---

## 自我审查清单

| 需求 | 对应任务 |
|------|----------|
| 时光轴首页 | Task 5 |
| 相册列表（双视图切换） | Task 6 (AlbumList) |
| 相册详情 & 照片网格 | Task 6 (AlbumDetail) |
| 照片上传 | Task 4 (UploadDialog) + Task 6 集成 |
| 照片移动 | Task 4 (MoveDialog) + Task 6 集成 |
| 照片删除 → 回收站 | Task 6 + Task 8 |
| 回收站 30 天保留 | Task 8 (Trash + TrashService) |
| 成员管理 + 审核 | Task 9 (Settings) |
| 管理员/成员权限 | Task 2 (User model) + Task 9 |
| 温暖家庭风视觉 | Task 1 (主题变量) + 各组件样式 |
| 响应式设计 | Task 1 (mixins) + 各组件 |
