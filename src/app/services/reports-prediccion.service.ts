import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface ReportePrediccion {
  codigo_estudiante: string;
  curso: string;
  trimestre: number;
  asistencia: number;
  nota_trimestre: number;
  conducta: number;
  rendimiento: string;
  factores_riesgo: string;
  observacion: string;
  fecha_registro?: string;
  mensaje_umbral: string;
  grado: number;
}

export interface EstudianteEnRiesgo {
  Codigo_estudiante: string;
  grado: number;
  curso: string;
  trimestre: number;
  nota_trimestre: number;
  causas_riesgo: string;
  rendimiento: string;
  mensaje_umbral: string;
}

export interface PorcentajeRiesgoCurso {
  curso: string;
  total_alumnos: number;
  en_riesgo: number;
  porcentaje_riesgo: number;
}

export interface PromedioCursoTrimestre {
  curso: string;
  trimestre: number;
  grado: number;
  promedio_nota: number;
}

export interface HistorialPrediccion {
  Codigo_estudiante: string;
  curso: string;
  trimestre: number;
  nota: number;
  asistencia: number;
  conducta: number;
  rendimiento: string;
  fecha_prediccion: string;
  observacion: string;
  mensaje_umbral: string;
  estudiante_id: number;
  grado: number;
}

export interface EstudianteRanking {
  codigo_estudiante: string;
  asistencia_promedio: number;
  calificacion_promedio: number;
  rendimiento: string;
  cursos_en_riesgo: string[];
}

export interface RankingEstudiantesResponse {
  trimestre: number;
  estudiantes: EstudianteRanking[];
}


@Injectable({
  providedIn: 'root'
})
export class ReportsPrediccionService {

  private apiUrl = 'http://127.0.0.1:8000/prediccion/reportes';
  private apiRiesgoUrl = 'http://127.0.0.1:8000/prediccion/reportes/riesgo';
  private apiPorcentajeRiesgoUrl = 'http://127.0.0.1:8000/prediccion/reportes/porcentaje-riesgo';
  private apipromCursoUrl= 'http://127.0.0.1:8000/prediccion/reportes/promedio';
  private apiHistorialUrl = 'http://127.0.0.1:8000/prediccion/historial';
  constructor(private http: HttpClient) {}

  obtenerReportes(mes?: number, anio?: number, grado?: number): Observable<ReportePrediccion[]> {
    let params: any = {};

    if (mes !== undefined) {
      params.mes = mes;
    }
    if (anio !== undefined) {
      params.anio = anio;
    }
    if (grado !== undefined) {
      params.grado = grado; // 👈 Agregamos el grado al query param
    }

    return this.http.get<ReportePrediccion[]>(this.apiUrl, { params });
  }

  obtenerEstudiantesEnRiesgo(curso?: string, trimestre?: number): Observable<EstudianteEnRiesgo[]> {
    const params: any = {};
    if (curso) params.curso = curso;
    if (trimestre !== undefined) params.trimestre = trimestre;
    return this.http.get<EstudianteEnRiesgo[]>(this.apiRiesgoUrl, { params });
  }

  obtenerPorcentajeRiesgoPorCurso(curso?: string, trimestre?: number, grado?: number): Observable<PorcentajeRiesgoCurso[]> {
    const params: any = {};

    if (curso) params.curso = curso;
    if (trimestre !== undefined) params.trimestre = trimestre;
    if (grado !== undefined) params.grado = grado; // 👈 Nuevo parámetro

    return this.http.get<PorcentajeRiesgoCurso[]>(this.apiPorcentajeRiesgoUrl, { params });
  }

  obtenerPromedioPorCursoTrimestre(curso?: string, trimestre?: number, grado?: number): Observable<PromedioCursoTrimestre[]> {
    const params: any = {};
    if (curso) params.curso = curso;
    if (trimestre !== undefined) params.trimestre = trimestre;
    if (grado !== undefined) params.grado = grado; // 👈 nuevo parámetro
    return this.http.get<PromedioCursoTrimestre[]>(this.apipromCursoUrl, { params });
  }

  obtenerHistorialPredicciones(): Observable<HistorialPrediccion[]> {
    return this.http.get<HistorialPrediccion[]>(this.apiHistorialUrl);
  }

  obtenerRankingEstudiantes(trimestre: number, grado?: number): Observable<RankingEstudiantesResponse> {
    let params = new HttpParams().set('trimestre', trimestre.toString());
    if (grado !== undefined) {
      params = params.set('grado', grado.toString());
    }
    return this.http.get<RankingEstudiantesResponse>(`${this.apiUrl}/ranking`, { params });
  }
}
