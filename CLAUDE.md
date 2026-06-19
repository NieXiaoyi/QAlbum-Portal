# CLAUDE.md

本文档为 Claude Code（claude.ai/code）在此仓库中工作提供指导。

## 命令

```bash
# 开发服务器（默认 http://localhost:4200）
npm start

# 生产构建
npm run build

# 运行单元测试（Vitest + Angular test runner）
npm test

# 监听模式构建
npm run watch
```

测试使用 Vitest（通过 `@angular/build:unit-test`）。配置文件位于 `tsconfig.spec.json`。暂未配置单个测试文件执行。

## 项目概览

QAlbum-Portal 是一个私有云相册，基于 Angular 22 + TypeScript 6.0 构建。所有组件均为 **standalone**（无 NgModules）。数据通过可注入服务持久化到 `localStorage` 中——开发无需后端 API。每个用户拥有完全独立的云空间，通过密码登录保护隐私。

## 架构

### 分层结构

```
src/
  app/
    core/           -- 服务、模型、守卫（无 UI）
      models/       -- TypeScript 接口（User, Album, Photo, TrashItem）
      services/     -- 可注入服务，localStorage 持久化
      guards/       -- 路由守卫（AuthGuard）
    shared/         -- 可复用 UI 组件和管道
      components/   -- ViewToggle, ConfirmDialog, UploadDialog, MoveDialog
      pipes/        -- TimeAgoPipe, FileSizePipe
    features/       -- 页面级组件，懒加载
      login/        -- 登录/注册页面
      timeline/     -- 首页：按月份分组的照片网格
      albums/       -- 相册列表（列表/网格切换）+ 相册详情
      photo-viewer/ -- 全屏暗色模式照片查看器
      trash/        -- 回收站（保留 30 天）
      settings/     -- 空间统计，个人资料编辑，修改密码
```

### 路由

通过 `app.routes.ts` 中的 `loadComponent()` 实现懒加载。路由如下：
- `/login` — LoginComponent（无守卫）
- `/` — TimelineComponent（默认，需登录）
- `/albums` — AlbumListComponent
- `/albums/:id` — AlbumDetailComponent
- `/trash` — TrashComponent
- `/settings` — SettingsComponent
- `/photo/:id` — PhotoViewerComponent

### 服务（全部使用 `providedIn: 'root'`）

| 服务 | 职责 | localStorage 键 |
|---------|---------------|-----------------|
| `AuthService` | 用户注册、登录/登出、密码验证 | `qalbum_users`, `qalbum_current_user` |
| `AlbumService` | 相册 CRUD（按 ownerId 隔离） | `qalbum_albums` |
| `PhotoService` | 照片上传、移动、删除（按 ownerId 隔离） | `qalbum_photos` |
| `TrashService` | 30 天回收站（按 ownerId 隔离） | `qalbum_trash` |

服务使用 `BehaviorSubject` + `localStorage` 进行状态管理。如需替换为真实 API，只需替换每个服务的实现，同时保持相同的方法签名和 Observable 返回类型即可。

### 主题系统

`src/styles/_variables.scss` 中的 SCSS 变量：温暖的家族色板（奶油色/焦糖色/赭色）、圆角尺度、阴影、字体大小、断点。

`src/styles/_mixins.scss` 中的响应式 mixin：`mobile` / `tablet` / `desktop` 断点以及 `responsive-grid($mobile-cols, $tablet-cols, $desktop-cols)`。

### 数据模型（全部位于 `src/app/core/models/`）

- **User**: id, name, email, password（btoa 编码）, joinedAt
- **Album**: id, name, description, coverPhotoId, photoCount, createdAt, updatedAt, ownerId
- **Photo**: id, albumId, ownerId, fileName, url, thumbnailUrl, size, width, height, uploadedAt, uploadedBy
- **TrashItem**: id, originalAlbumId, originalAlbumName, photo, deletedAt, expiresAt（30 天）

### 导航栏

移动端固定在底部，桌面端固定在顶部（参见 `app.html` + `app.scss`）。四个标签页：时光轴, 相册, 回收站, 设置。登录页隐藏导航栏。

## 关键设计决策

- **仅使用 Standalone 组件** — 无 NgModules，无 `app.module.ts`
- **localStorage 持久化** — 所有数据在刷新页面后仍保留；通过 DevTools → Application → Local Storage → 以 `qalbum_` 开头的键来清除数据
- **懒加载路由** — 每个功能页面为独立的代码块
- **tsconfig 中未启用 `strict: true`** — 未启用 `strictNullChecks` 及相关标志；使用 `find()` 结果时需注意可能为 undefined
- **Angular 22** 使用 `app.ts` / `app.html` / `app.scss` 命名约定（而非 `app.component.ts`）作为根组件
- **无后端** — 应用完全运行在客户端；服务可替换为基于 HTTP 的实现
- **按用户数据隔离** — 所有服务通过 `ownerId` 过滤数据，确保用户只能访问自己的内容
- **密码验证** — AuthService 使用 btoa 编码密码进行本地验证，无审批流程

## 规则
1. 工作前必须读取README.md，了解当前项目的主要功能
2. 每次工作完成后，如果主要功能发生了改动，务必刷新README.md，README.md中不要引用被.gitignore忽略的文件
3. 每次工作完成后，如果代码架构、数据模型、关键设计等发生了改动，务必刷新CLAUDE.md
