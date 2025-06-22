import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  nombre = '';
  apellido = '';
  correo = '';
  password  = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    const newUser = {
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
      contraseña: this.password
    };

    this.authService.register(newUser).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: err => {
        if (err.status === 400 || err.error?.message?.includes('correo')) {
          this.errorMessage = 'Este correo ya está registrado. Intenta con otro.';
        } else {
          this.errorMessage = 'Error al registrar usuario. Intenta nuevamente.';
        }
        console.error(err);
      }
    });
  }
}
