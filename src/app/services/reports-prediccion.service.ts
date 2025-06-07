import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class ReportsPrediccionService {

  private apiUrl = 'http://127.0.0.1:8000/prediccion/reportes';
  constructor(private http: HttpClient) {}

  obtenerReportes(): Observable<ReportePrediccion[]> {
    return this.http.get<ReportePrediccion[]>(this.apiUrl);
  }
}
