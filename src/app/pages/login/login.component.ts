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

  mostrarRecuperacion: boolean = false;
  correoRecuperacion: string = '';
  showRecuperacionModal: boolean = false;


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
  /*
  onRecoverPassword(event: Event): void {
    event.preventDefault();
    // Aquí puedes abrir un modal, redirigir a una vista, o mostrar un campo para ingresar el correo
    // Ejemplo simple: mostrar un prompt
    const correo = prompt('Ingresa tu correo para recuperar la contraseña:');
    if (correo) {
      this.authService.recoverPassword(correo).subscribe({
        next: () => alert('Se ha enviado una contraseña temporal a tu correo.'),
        error: err => alert('Error: ' + (err.error?.detail || 'No se pudo recuperar la contraseña'))
      });
    }
  }*/

  toggleRecuperacion(event: Event): void {
    event.preventDefault();
    this.showRecuperacionModal = true;
  }

  closeRecuperacionModal(): void {
    this.showRecuperacionModal = false;
    this.correoRecuperacion = '';
  }

  enviarRecuperacion(): void {
    if (!this.correoRecuperacion) {
      this.errorMessage = 'Por favor ingresa tu correo.';
      return;
    }

    this.authService.recoverPassword(this.correoRecuperacion).subscribe({
      next: () => {
        alert('Se ha enviado una contraseña temporal a tu correo.');
        this.closeRecuperacionModal();
      },
      error: err => {
        this.errorMessage = err.error?.detail || 'No se pudo recuperar la contraseña';
      }
    });
  }


}

