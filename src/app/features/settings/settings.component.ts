import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlbumService } from '../../core/services/album.service';
import { PhotoService } from '../../core/services/photo.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
