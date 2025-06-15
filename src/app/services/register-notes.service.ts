import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RendimientoAcademico {
  id:number;
  estudiante_id: number;
  curso: string;
  trimestre: number;
  asistencia: number;
  nota_trimestre: number;
  conducta: number;
  rendimiento?: string;
  factores_riesgo?: string;
  Mensaje_riesgo?: string | string[];
  mensaje_umbral?: string;
}

export interface EstudianteInfo {
  id: number;
  Codigo_estudiante: string;
  grado: number;
  presencia_padres: string;
  trabaja: boolean;
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
  obtenerNotasPorEstudiante(estudianteId: number): Observable<RendimientoAcademico[]> {
  return this.http.get<RendimientoAcademico[]>(`${this.apiUrl}/estudiante/${estudianteId}`);
  }
  actualizarNota(id: number, data: RendimientoAcademico): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, data);
  }
  eliminarNota(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  predecirRendimiento(estudianteId: number, nota: RendimientoAcademico) {
  const payload = {
    estudiante_id: estudianteId,
    curso: nota.curso,
    trimestre: nota.trimestre
  };
  return this.http.post<any>('http://127.0.0.1:8000/prediccion/predecir_rendimiento', payload);
  }

}

