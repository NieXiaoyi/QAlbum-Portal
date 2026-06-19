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
