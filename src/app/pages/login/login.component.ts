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
  acceptedTerms: boolean = false;
  showTermsError: boolean = false;
  showModal: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onLogin(): void {
    if (!this.acceptedTerms) {
      this.showTermsError = true;
      return;
    }

    this.showTermsError = false;

    this.authService.login(this.email, this.password).subscribe(
      response => {
        this.authService.saveToken(response.access_token);
        this.router.navigate(['/dashboard']);
      },
      error => {
        console.log('Error de login:', error);
        this.errorMessage = 'Credenciales incorrectas. Intenta nuevamente.';
      }
    );
  }

  openModal(event: MouseEvent): void {
    event.preventDefault();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }
  togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
  }
}

