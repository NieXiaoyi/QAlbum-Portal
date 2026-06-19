import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { User } from './core/models/user.model';

describe('App', () => {
  beforeEach(async () => {
    // Provide a stub that simulates a logged-in user
    const authServiceStub: Partial<AuthService> = {
      isLoggedIn: () => true,
      currentUser$: new BehaviorSubject<User | null>({
        id: 'test-1',
        name: 'Test',
        email: 'test@test.com',
        password: '',
        joinedAt: new Date(),
      }).asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '', component: App }]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render bottom navigation when logged in', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navItems = compiled.querySelectorAll('.nav-item');
    expect(navItems.length).toBe(4);
    expect(navItems[0].textContent).toContain('时光轴');
  });
});
