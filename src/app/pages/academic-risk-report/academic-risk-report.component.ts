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
import autoTable from 'jspdf-autotable';
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
  gradoSeleccionado: number | '' = '';
  grados = [
    { valor: 1, nombre: 'Primer Grado' },
    { valor: 2, nombre: 'Segundo Grado' },
    { valor: 3, nombre: 'Tercer Grado' },
    { valor: 4, nombre: 'Cuarto Grado' },
    { valor: 5, nombre: 'Quinto Grado' },
    { valor: 6, nombre: 'Sexto Grado' }
  ];

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
      if (this.gradoSeleccionado !== '') {
        data = data.filter(e => e.grado === +this.gradoSeleccionado);
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
      this.trimestreSeleccionado === null ? undefined : this.trimestreSeleccionado,
      this.gradoSeleccionado === '' ? undefined : +this.gradoSeleccionado // 👈 Aquí enviamos el grado
    ).subscribe((datos: PorcentajeRiesgoCurso[]) => {
      this.barChartLabels = datos.map(d => d.curso);
      this.barChartData.datasets[0].data = datos.map(d => d.porcentaje_riesgo);
      this.barChartData.labels = this.barChartLabels;

      this.chart?.update();
    });
  }

  obtenerPromedioPorCurso(): void {
    this.reportService.obtenerPromedioPorCursoTrimestre(
      this.cursoSeleccionado,
      this.trimestreSeleccionado,
      this.gradoSeleccionado === '' ? undefined : +this.gradoSeleccionado
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
    this.gradoSeleccionado = '';
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
    const doc = new jsPDF('l', 'mm', 'a4');

    autoTable(doc, {
      head: [[
        'Código', 'Grado', 'Curso', 'Trimestre', 'Nota', 'Riesgo', 'Rendimiento'
      ]],
      body: this.dataSource.data.map(est => [
        est.Codigo_estudiante, est.grado, est.curso, est.trimestre,
        est.nota_trimestre, est.causas_riesgo, est.rendimiento
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
      startY: 15
    });

    // 📊 Agregar el gráfico después de la tabla
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, 90, 250, 80); // Ajusta valores si es necesario
    }

    doc.save('reporte_riesgo_academico.pdf');
  }
}
