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
        this.errorMessage = 'Error al registrar usuario';
        console.error(err);
      }
    });
  }
}
