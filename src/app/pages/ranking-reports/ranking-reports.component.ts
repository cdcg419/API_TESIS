import { Component, OnInit } from '@angular/core';
import { ReportsPrediccionService, EstudianteRanking } from '../../services/reports-prediccion.service';
import { MatDialog } from '@angular/material/dialog';
import { EstudianteDetalleDialogComponent } from '../estudiante-detalle-dialog/estudiante-detalle-dialog.component';
@Component({
  selector: 'app-ranking-reports',
  standalone: false,
  templateUrl: './ranking-reports.component.html',
  styleUrl: './ranking-reports.component.css'
})
export class RankingReportsComponent implements OnInit{
  columnasTabla: string[] = ['codigo_estudiante', 'asistencia_promedio', 'calificacion_promedio', 'rendimiento', 'cursos_en_riesgo'];
  trimestreSeleccionado = 1;
  gradoSeleccionado: number = 1;
  ranking: EstudianteRanking[] = [];
  estudianteSeleccionado: EstudianteRanking | null = null;
  cargando = false;
  mensajeSinRanking: string = '';
  mensajeErrorRanking: string = '';
  trimestres = [
    { value: 1, label: 'Primer trimestre' },
    { value: 2, label: 'Segundo trimestre' },
    { value: 3, label: 'Tercer trimestre' }
  ];

  grados = [
    { value: 1, label: 'Primer grado' },
    { value: 2, label: 'Segundo grado' },
    { value: 3, label: 'Tercer grado' },
    { value: 4, label: 'Cuarto grado' },
    { value: 5, label: 'Quinto grado' },
    { value: 6, label: 'Sexto grado' }
  ];

  constructor(private reporteService: ReportsPrediccionService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.obtenerRanking();
  }

  obtenerRanking(): void {
    this.cargando = true;
    this.mensajeSinRanking = '';
    this.mensajeErrorRanking = '';

    this.reporteService.obtenerRankingEstudiantes(this.trimestreSeleccionado, this.gradoSeleccionado!).subscribe({
      next: (res) => {
        this.ranking = res.estudiantes;
        this.estudianteSeleccionado = null;
        this.cargando = false;

        if (this.ranking.length === 0) {
          this.mensajeSinRanking = 'No se encontraron estudiantes para los filtros seleccionados.';
        }
      },
      error: (err) => {
        console.error('Error al generar el ranking:', err);
        this.mensajeErrorRanking = 'Error al generar el ranking. Por favor, intente de nuevo.';
        this.cargando = false;
      }
    });
  }

  seleccionarEstudiante(estudiante: EstudianteRanking): void {
    this.estudianteSeleccionado = estudiante;
  }

  abrirDialogoDetalle(estudiante: EstudianteRanking): void {
    this.dialog.open(EstudianteDetalleDialogComponent, {
      width: '400px',
      data: estudiante
    });
  }
  limpiarFiltros(): void {
    this.trimestreSeleccionado = 1;
    this.gradoSeleccionado = 1;
    this.obtenerRanking();
  }

  exportarExcel(): void {
    import("xlsx").then(xlsx => {
      const worksheet = xlsx.utils.json_to_sheet(this.ranking);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ranking_estudiantes.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportarPDF(): void {
    import("jspdf").then(jsPDF => {
      import("jspdf-autotable").then(module => {
        const jsPDFInstance = new jsPDF.default();
        const autoTable = module.default;

        autoTable(jsPDFInstance, {
          head: [['Código', 'Promedio de Asistencia (%)', 'Promedio de Calificación', 'Rendimiento', 'Cursos en riesgo']],
          body: this.ranking.map(e => [
            e.codigo_estudiante,
            `${e.asistencia_promedio}%`,
            e.calificacion_promedio,
            e.rendimiento,
            e.cursos_en_riesgo.join(', ')
          ]),
          startY: 20
        });

        jsPDFInstance.save("ranking_estudiantes.pdf");
      });
    });
  }
}
