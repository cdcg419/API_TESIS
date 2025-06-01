import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Student {
  id?: number;
  Codigo_estudiante: string;
  edad: number;
  grado: number;
  genero: string;
  presencia_padres: string;
  trabaja: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {

private apiUrl = 'http://127.0.0.1:8000/estudiantes'; // Ajusta la URL si es necesario

  constructor(private http: HttpClient) {}

  // Crear estudiante
  createStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(this.apiUrl + '/', student);
  }

  // Obtener lista de estudiantes
  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl + '/');
  }

  // Obtener estudiante por ID
  getStudent(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`);
  }

  // Actualizar estudiante
  updateStudent(id: number, student: Student): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}`, student);
  }

  // Eliminar estudiante
  deleteStudent(id: number): Observable<Student> {
    return this.http.delete<Student>(`${this.apiUrl}/${id}`);
  }
}

