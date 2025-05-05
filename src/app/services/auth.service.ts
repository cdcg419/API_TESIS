import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/auth';  // URL del backend

  constructor(private http: HttpClient) { }

  // Método para registrar un usuario
  register(user: {
    nombre: string,
    apellido: string,
    correo: string,
    contraseña: string
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  // Método para hacer login y obtener el token
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      correo: email,
      contraseña: password
    }).pipe(
      tap(response => {
        if (response && response.access_token) {
          // Guardar el token de acceso
          this.saveToken(response.access_token);
          // Guardar los datos del usuario en localStorage
          localStorage.setItem('user_data', JSON.stringify(response.user)); // Asumiendo que 'response.user' tiene los datos del usuario
        }
      })
    );
  }

  // Método para obtener los datos del usuario desde localStorage
  getUserData(): any {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      return JSON.parse(userData); // Retorna los datos del usuario almacenados en localStorage
    }
    return null; // Si no hay datos, retorna null
  }

  // Método para actualizar los datos del usuario
  updateUser(userId: number, user: { nombre: string, apellido: string, correo: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${userId}`, user);
  }


  // Guardar token
  saveToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');  // Eliminar los datos del usuario al cerrar sesión
  }

  // Verificar autenticación
  isAuthenticated(): Observable<boolean> {
    const token = localStorage.getItem('access_token');
    return of(!!token);  // Devuelve un observable con true/false dependiendo de la presencia del token
  }
  //actualizar contraseña
  updatePassword(data: { user_id: number; new_password: string }): Observable<any> {
    return this.http.put(`http://127.0.0.1:8000/api/auth/update_password`, data);
  }

  //Eliminar usuario
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${userId}`);
  }

}



