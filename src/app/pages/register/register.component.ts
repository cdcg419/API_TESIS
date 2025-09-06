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
  
  // Variables para el modal
  showModal = false;
  modalMessage = '';
  modalType: 'success' | 'error' | null = null; // Variable para el tipo de mensaje

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
        this.modalMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
        this.modalType = 'success'; // Establece el tipo de modal a 'success'
        this.showModal = true;

        setTimeout(() => {
          this.closeModal();
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: err => {
        if (err.status === 400 || err.error?.message?.includes('correo')) {
          this.modalMessage = 'Este correo ya está registrado. Intenta con otro.';
        } else {
          this.modalMessage = 'Error al registrar usuario. Intenta nuevamente.';
        }
        this.modalType = 'error'; // Establece el tipo de modal a 'error'
        this.showModal = true;
        console.error(err);
      }
    });
  }

  // Función para cerrar el modal
  closeModal(): void {
    this.showModal = false;
    this.modalMessage = '';
    this.modalType = null; // Restablece el tipo de modal
  }
}