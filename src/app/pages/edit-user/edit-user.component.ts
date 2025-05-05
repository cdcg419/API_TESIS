import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-user',
  standalone: false,
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {
  userId!: number;  // El operador ! asegura que userId será asignado antes de usarse
  nombre: string = '';
  apellido: string = '';
  correo: string = '';
  errorMessage: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: string = '';
  passwordSuccess: string = '';

  // Variables para manejar la visibilidad de los modales
  showModalDatos: boolean = false;
  showModalPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData) {
      this.userId = userData.id;
      this.nombre = userData.nombre;
      this.apellido = userData.apellido;
      this.correo = userData.correo;
    }
  }

  // Abrir el modal para editar los datos de usuario
  onSaveDatos(): void {
    this.showModalDatos = true;
  }

  // Confirmar cambios en los datos
  confirmSaveDatos(): void {
    const updatedUser = {
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
    };

    this.authService.updateUser(this.userId, updatedUser).subscribe(
      (response) => {
        this.router.navigate(['/login']);  // Redirigir al login
        this.showModalDatos = false; // Cerrar el modal
      },
      (error) => {
        this.errorMessage = 'Hubo un error al actualizar los datos del usuario.';
      }
    );
  }

  // Cancelar cambios en los datos
  cancelSaveDatos(): void {
    this.showModalDatos = false;
  }

  // Abrir el modal para cambiar la contraseña
  onSavePassword(): void {
    this.showModalPassword = true;
  }

  // Confirmar cambio de contraseña
  confirmSavePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden.';
      this.passwordSuccess = '';
      return;
    }

    const data = {
      user_id: this.userId,
      new_password: this.newPassword
    };

    this.authService.updatePassword(data).subscribe(
      (response) => {
        this.passwordSuccess = 'Contraseña actualizada exitosamente.';
        this.passwordError = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.router.navigate(['/login']); // Redirigir al login
        this.showModalPassword = false; // Cerrar el modal

      },
      (error) => {
        this.passwordError = 'Error al actualizar la contraseña.';
        this.passwordSuccess = '';
      }
    );
  }

  // Cancelar cambio de contraseña
  cancelSavePassword(): void {
    this.showModalPassword = false;
  }
  onDeleteAccount(): void {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');

    if (confirmed) {
      this.authService.deleteUser(this.userId).subscribe(
        (response) => {
          alert('Tu cuenta ha sido eliminada.');
          this.router.navigate(['/login']);  // Redirigir al login después de eliminar la cuenta
        },
        (error) => {
          this.errorMessage = 'Hubo un error al eliminar tu cuenta.';
        }
      );
    }
  }
}

