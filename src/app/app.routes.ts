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
