import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RendimientoAcademico {
  estudiante_id: number;
  curso: string;
  trimestre: number;
  asistencia: number;
  nota_trimestre: number;
  conducta: number;
}

export interface EstudianteInfo {
  id: number;
  nombre: string;
  apellido_paterno: string;
  grado: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterNotesService {

  private apiUrl = 'http://127.0.0.1:8000/registro-academico';

  constructor(private http: HttpClient) { }

  registrarNotas(data: RendimientoAcademico): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, data);
  }
  obtenerEstudiantesPorDocente(docente_id: number): Observable<EstudianteInfo[]> {
  return this.http.get<EstudianteInfo[]>(`${this.apiUrl}/estudiantes-docente/${docente_id}`);
  }

}
