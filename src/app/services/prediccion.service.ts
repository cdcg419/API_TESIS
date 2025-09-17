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
  observacion: string | string[];
  mensaje_umbral: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {
  private apiUrl = 'https://backend-predix-h2grc3g4drb2hreh.canadacentral-01.azurewebsites.net/api/auth/docente/predicciones';

  constructor(private http: HttpClient) {}

  obtenerPredicciones(): Observable<ResultadoPrediccion[]> {
    return this.http.get<ResultadoPrediccion[]>(this.apiUrl);
  }
}
