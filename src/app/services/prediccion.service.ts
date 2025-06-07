import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ResultadoPrediccion {
  estudiante_id: number;
  Codigo_estudiante: string;
  curso: string;
  trimestre: number;
  rendimiento: string;
  factores_riesgo: string;
  observacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {
  private apiUrl = 'http://127.0.0.1:8000/api/auth/docente/predicciones';

  constructor(private http: HttpClient) {}

  obtenerPredicciones(): Observable<ResultadoPrediccion[]> {
    return this.http.get<ResultadoPrediccion[]>(this.apiUrl);
  }
}
