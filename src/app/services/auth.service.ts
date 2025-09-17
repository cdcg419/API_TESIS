import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://backend-predix-h2grc3g4drb2hreh.canadacentral-01.azurewebsites.net/api/auth';  // URL del backend

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
          localStorage.setItem('userId', response.user.id.toString());
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
  logout(): Observable<any> {
    const token = this.getToken();

    if (!token) {
      // Si no hay token, simplemente limpia y retorna un observable vacío
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      return of({ mensaje: 'Sesión cerrada localmente' });
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      })
    );
  }

  // Verificar autenticación
  isAuthenticated(): Observable<boolean> {
    const token = localStorage.getItem('access_token');
    return of(!!token);  // Devuelve un observable con true/false dependiendo de la presencia del token
  }
  //actualizar contraseña
  updatePassword(data: { user_id: number; new_password: string }): Observable<any> {
    return this.http.put(`https://backend-predix-h2grc3g4drb2hreh.canadacentral-01.azurewebsites.net/api/auth/update_password`, data);
  }

  //Eliminar usuario
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${userId}`);
  }

  recoverPassword(correo: string): Observable<any> {
    const body = new HttpParams().set('correo', correo);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post(`${this.apiUrl}/recuperar`, body.toString(), { headers });
  }

}



