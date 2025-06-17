import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DistribucionGenero {
  hombres: number;
  mujeres: number;
}

interface EstudiantesTrabajan {
  grado: number;
  porcentaje: number;
}

interface RendimientoBajo {
  curso: string;
  porcentaje: number;
}

interface EstudianteBajoRendimiento {
  nombre: string;
  grado: number;
  curso: string;
  trimestre: number;
  nivel_intervencion: string;
}


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'http://127.0.0.1:8000/dashboard';

  constructor(private http: HttpClient) {}

  obtenerTotalCursosAsignados(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/cursos_asignados`);
  }
  obtenerTotalEstudiantes(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/total_estudiantes`);
  }
  obtenerDistribucionGenero(): Observable<DistribucionGenero> {
    return this.http.get<DistribucionGenero>(`${this.apiUrl}/genero_estudiantes`);
  }
  obtenerEstudiantesTrabajan(): Observable<EstudiantesTrabajan[]> {
    return this.http.get<EstudiantesTrabajan[]>(`${this.apiUrl}/estudiantes_trabajan`);
  }
  obtenerRendimientoBajo(trimestre: number, grado: number): Observable<RendimientoBajo[]> {
    return this.http.get<RendimientoBajo[]>(
      `${this.apiUrl}/rendimiento_bajo?trimestre=${trimestre}&grado=${grado}`
    );
  }
  obtenerEstudiantesBajoRendimiento(trimestre: number): Observable<EstudianteBajoRendimiento[]> {
  return this.http.get<EstudianteBajoRendimiento[]>(`${this.apiUrl}/estudiantes_bajo_rendimiento?trimestre=${trimestre}`);
  }

}
