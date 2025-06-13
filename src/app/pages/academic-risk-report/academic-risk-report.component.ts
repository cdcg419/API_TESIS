import { Component, OnInit } from '@angular/core';
import { ViewChild, AfterViewInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatTableDataSource } from '@angular/material/table';
import { ReportsPrediccionService, EstudianteEnRiesgo, PorcentajeRiesgoCurso, PromedioCursoTrimestre } from '../../services/reports-prediccion.service';
import { RegisterNotesService } from '../../services/register-notes.service';
import { NotasEventService } from '../../services/notas-event.service';
import { BaseChartDirective } from 'ng2-charts';
import { MatPaginator } from '@angular/material/paginator';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-academic-risk-report',
  standalone: false,
  templateUrl: './academic-risk-report.component.html',
  styleUrl: './academic-risk-report.component.css'
})
export class AcademicRiskReportComponent implements OnInit{
  estudiantesEnRiesgo: EstudianteEnRiesgo[] = [];
  promediosPorCurso: PromedioCursoTrimestre[] = [];
  cursos: string[] = [];
  trimestres: number[] = [1, 2, 3];

  dataSource = new MatTableDataSource<EstudianteEnRiesgo>();

  cursoSeleccionado: string = '';
  trimestreSeleccionado: number = 1;
  rendimientoSeleccionado: string = '';

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Gráfico de barras
  barChartLabels: string[] = [];
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.barChartLabels,
    datasets: [
      { data: [], label: '% de estudiantes en riesgo', backgroundColor: '#f44336' }
    ]
  };
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100, // 🔹 Esto asegura que el eje Y siempre llegue hasta 100%
        ticks: { stepSize: 10 }
      }
    }
  };

  constructor(private reportService: ReportsPrediccionService, private registerNotesService: RegisterNotesService, private notasEventService: NotasEventService) {}

  ngOnInit(): void {
    this.notasEventService.notaCambiada$.subscribe(() => {
      this.refrescarDatos(); // función que vuelve a cargar los datos
    });

    this.refrescarDatos(); // carga inicial
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chart?.update();  // Fuerza el redibujado del gráfico
    }, 0);
  }

  refrescarDatos(): void {
    this.obtenerEstudiantes();
    this.obtenerPorcentajeRiesgo();
    this.obtenerPromedioPorCurso();
  }

  obtenerEstudiantes(): void {
    this.reportService.obtenerEstudiantesEnRiesgo(
      this.cursoSeleccionado,
      this.trimestreSeleccionado === null ? undefined : this.trimestreSeleccionado
    ).subscribe(data => {
      // Si hay filtro por rendimiento, lo aplicamos
      if (this.rendimientoSeleccionado) {
        data = data.filter(e => e.rendimiento === this.rendimientoSeleccionado);
      }

      this.estudiantesEnRiesgo = data;
      this.dataSource = new MatTableDataSource<EstudianteEnRiesgo>(data);
      this.dataSource.paginator = this.paginator;

      this.cursos = [...new Set(data.map(est => est.curso))];
    });
  }

  obtenerPorcentajeRiesgo(): void {
    this.reportService.obtenerPorcentajeRiesgoPorCurso(
      this.cursoSeleccionado,
      this.trimestreSeleccionado === null ? undefined : this.trimestreSeleccionado
    ).subscribe((datos: PorcentajeRiesgoCurso[]) => {
      this.barChartLabels = datos.map(d => d.curso);
      this.barChartData.datasets[0].data = datos.map(d => d.porcentaje_riesgo);
      this.barChartData.labels = this.barChartLabels;

      // 🔁 Forzar actualización del gráfico
      this.chart?.update();
    });
  }

  obtenerPromedioPorCurso(): void {
    this.reportService.obtenerPromedioPorCursoTrimestre(
      this.cursoSeleccionado,
      this.trimestreSeleccionado
    ).subscribe(data => {
      this.promediosPorCurso = data;
    });
  }


  /*obtenerPorcentajeRiesgo(): void {
    this.reportService.obtenerPorcentajeRiesgoPorCurso(
      this.cursoSeleccionado,
      this.trimestreSeleccionado === null ? undefined : this.trimestreSeleccionado,
    ).subscribe((datos: PorcentajeRiesgoCurso[]) => {
      this.barChartLabels = datos.map(d => d.curso);
      this.barChartData.datasets[0].data = datos.map(d => d.porcentaje_riesgo);
      this.barChartData.labels = this.barChartLabels;

      // 🔁 Forzar actualización del gráfico
      this.chart?.update();
    });
  }*/

  eliminarNota(id: number): void {
    this.registerNotesService.eliminarNota(id).subscribe({
      next: () => {
        console.log('Nota eliminada correctamente');
        this.obtenerEstudiantes();         // actualiza tabla
        this.obtenerPorcentajeRiesgo();    // actualiza gráfico
      },
      error: (err) => {
        console.error('Error al eliminar nota:', err);
      }
    });
  }


  aplicarFiltros(): void {
    this.obtenerEstudiantes();
    this.obtenerPorcentajeRiesgo();
    this.obtenerPromedioPorCurso();
  }

  limpiarFiltros(): void {
    this.cursoSeleccionado = '';
    this.trimestreSeleccionado = 1;
    this.rendimientoSeleccionado = '';
    this.obtenerEstudiantes();
    this.obtenerPorcentajeRiesgo();
    this.obtenerPromedioPorCurso();
  }

  exportarExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.estudiantesEnRiesgo);
    const workbook = { Sheets: { 'Estudiantes en Riesgo': worksheet }, SheetNames: ['Estudiantes en Riesgo'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileName = `reporte_riesgo_${new Date().getTime()}.xlsx`;
    FileSaver.saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), fileName);
  }

  exportarPDF(): void {
    const contenido = document.getElementById('contenido-reporte');
    if (!contenido) return;

    html2canvas(contenido, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`reporte_completo_${new Date().getTime()}.pdf`);
    });
  }
}
