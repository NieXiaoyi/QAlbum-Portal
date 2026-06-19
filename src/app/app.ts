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
