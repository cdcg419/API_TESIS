import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Student {
  id?: number;
  nombre: string;
  edad: number;
  genero: string;
  grado: number;
  presencia_padres: string;
  trabaja: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private apiUrl = 'http://localhost:8000/students';

  constructor(
    private http: HttpClient,
    private authService: AuthService  // Inyectar AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    // Obtener el token del AuthService
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    // Crear los encabezados con el token de autenticación
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getStudents(): Observable<{ students: Student[] }> {
    return this.http.get<{ students: Student[] }>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  createStudent(student: Student): Observable<Student> {
    // Obtener el docente_id desde el AuthService
    const docenteId = this.authService.getUserData()?.id;  // Obtener el ID del docente

    if (!docenteId) {
      throw new Error('Docente ID no disponible');
    }

    // Agregar docente_id al objeto student
    const studentWithDocenteId = { ...student, docente_id: docenteId };

    // Enviar la solicitud POST con el docente_id y los encabezados de autenticación
    return this.http.post<Student>(this.apiUrl, studentWithDocenteId, { headers: this.getAuthHeaders() });
  }

  updateStudent(id: number, student: Partial<Student>): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}`, student, { headers: this.getAuthHeaders() });
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getStudentById(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
