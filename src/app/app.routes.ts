import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/timeline/timeline.component').then(m => m.TimelineComponent) },
  { path: 'albums', loadComponent: () => import('./features/albums/album-list/album-list.component').then(m => m.AlbumListComponent) },
  { path: 'albums/:id', loadComponent: () => import('./features/albums/album-detail/album-detail.component').then(m => m.AlbumDetailComponent) },
  { path: 'trash', loadComponent: () => import('./features/trash/trash.component').then(m => m.TrashComponent) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
  { path: 'photo/:id', loadComponent: () => import('./features/photo-viewer/photo-viewer.component').then(m => m.PhotoViewerComponent) },
  { path: '**', redirectTo: '' },
];
