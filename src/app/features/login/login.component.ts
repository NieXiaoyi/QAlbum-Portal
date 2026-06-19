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
