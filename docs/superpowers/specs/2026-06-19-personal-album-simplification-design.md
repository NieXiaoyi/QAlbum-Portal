# QAlbum 私有云相册精简设计

> 基于现有家族共享相册裁剪，改为个人私密云相册
> 日期：2026-06-19

## 概述

将 QAlbum 从「家庭共享云相册」（含角色权限、成员审核、相册成员管理）精简为 **个人私有云相册**。每个用户通过邮箱+密码注册登录，拥有完全独立的数据空间。

## 数据模型变更

### User 模型

```typescript
// 精简后
export interface User {
  id: string;
  name: string;
  email: string;        // 登录凭证
  password: string;     // 新增，btoa() 哈希存储
  joinedAt: Date;
}
```

**删除：** `role`（admin/member）、`status`（active/pending）

### Album 模型

```typescript
export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;      // 新增，替代 members[]
}
```

**删除：** `members: User[]`
**新增：** `ownerId: string`

### Photo 模型

```typescript
export interface Photo {
  id: string;
  albumId: string;
  ownerId: string;      // 新增，直接隔离
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: Date;
  uploadedBy: string;   // 保留，当前用户 ID
}
```

**新增：** `ownerId: string`

### TrashItem 模型

```typescript
export interface TrashItem {
  id: string;
  originalAlbumId: string;
  originalAlbumName: string;
  photo: Photo;             // Photo 已含 ownerId
  deletedAt: Date;
  expiresAt: Date;
}
```

不变，通过内嵌 Photo 的 ownerId 做隔离。

## 认证系统

放弃当前「选择用户 + 管理员审批」模式，改为标准邮箱密码认证。

### 密码存储

客户端 localStorage 场景，使用 `btoa()` 编码（非安全哈希，避免明文存储即可）。

```
注册：password = btoa(raw)
登录：比对 btoa(input) === stored
```

### AuthService 变更

| 方法 | 变化 |
|------|------|
| `register(name, email, password)` | 新增，直接创建 active 用户 |
| `login(email, password)` | 重写，按邮箱查找 + 密码比对 |
| `logout()` | 不变 |
| `approveMember()` | 删除 |
| `rejectMember()` | 删除 |
| `isAdmin()` | 删除 |
| `getPendingUsers()` | 删除 |

### 首次使用流程

无预置用户。登录页为空 → 用户点击「注册」→ 创建第一个用户 → 自动登录。

## 数据隔离

所有 Service 增加按 `ownerId` 过滤。

### AlbumService

- `getAlbums()` → filter `ownerId === currentUser.id`
- `createAlbum()` → 自动注入 `ownerId`
- 其余操作不变

### PhotoService

- `getPhotos(albumId?)` → filter `ownerId === currentUser.id`
- `uploadPhotos()` → 自动注入 `ownerId`
- `movePhotos()` / `deletePhotos()` → 仅操作自己的照片

### TrashService

- 所有操作带 `ownerId` 过滤
- 30 天自动清理逻辑不变

### localStorage Key 不变

`qalbum_users` / `qalbum_albums` / `qalbum_photos` / `qalbum_trash`

## 路由变更

```typescript
export const routes: Routes = [
  { path: 'login',    loadComponent: () => LoginComponent },
  { path: '',         loadComponent: () => TimelineComponent, canActivate: [AuthGuard] },
  { path: 'albums',   loadComponent: () => AlbumListComponent, canActivate: [AuthGuard] },
  { path: 'albums/:id', loadComponent: () => AlbumDetailComponent, canActivate: [AuthGuard] },
  { path: 'trash',    loadComponent: () => TrashComponent, canActivate: [AuthGuard] },
  { path: 'settings', loadComponent: () => SettingsComponent, canActivate: [AuthGuard] },
  { path: 'photo/:id', loadComponent: () => PhotoViewerComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];
```

### 新增文件

| 文件 | 用途 |
|------|------|
| `src/app/core/guards/auth.guard.ts` | 登录守卫（替换 AdminGuard） |
| `src/app/features/login/login.component.ts` | 登录/注册页面 |
| `src/app/features/login/login.component.html` | 登录页模板 |
| `src/app/features/login/login.component.scss` | 登录页样式 |

### 删除文件

| 文件 | 原因 |
|------|------|
| `src/app/core/guards/admin.guard.ts` | 不再需要管理员守卫 |

## UI 变更

### 登录页 (`/login`)

基本的邮箱 + 密码表单，含登录/注册切换：
- 登录模式：邮箱 + 密码 + 登录按钮 + 「没有账号？去注册」
- 注册模式：姓名 + 邮箱 + 密码 + 注册按钮 + 「已有账号？去登录」
- 校验：邮箱非空、密码≥4位
- 错误提示：账号不存在 / 密码错误 / 邮箱已注册

### 导航栏

AppShell 中隐藏导航栏的条件：不显示在登录页。通过 `Router` 判断当前路由。

### 设置页精简

去掉所有成员管理 UI，改为：

1. **个人信息卡片**：头像、姓名、邮箱
2. **空间统计**：相册数、照片数、总占用空间
3. **个人资料**：修改姓名/邮箱
4. **修改密码**：旧密码 → 新密码 → 确认
5. **退出登录**：二次确认 → 跳转登录页

## 实现注意

- 密码校验在客户端完成，无后端 API 调用
- 所有数据操作通过 AuthService 的 `getCurrentUser()` 获取当前用户 ID
- `ownerId` 需在照片上传、相册创建时通过服务自动注入，不依赖调用方传入
- 数据迁移：新版数据模型与旧版不兼容（用户无密码、相册有 members[] 而非 ownerId、照片无 ownerId）。检测到旧版数据结构时自动清空所有 `qalbum_*` localStorage 键，全新开始。无需兼容旧数据。
- 退出登录后清除 `currentUserSubject`，路由守卫自动跳转登录页

## 不做的功能

- ❌ 密码找回 / 重置（无后端邮箱发送能力）
- ❌ 头像上传（保留初始头像逻辑）
- ❌ 双因素认证
- ❌ 数据导出
