import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }


  onLogin(): void {
    this.authService.login(this.email, this.password).subscribe(
      response => {
        this.authService.saveToken(response.access_token);
        this.router.navigate(['/dashboard']);
      },
      error => {
        console.log('Error de login:', error);
      }
    );

  }
}
