import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { Router } from '@angular/router';
import { ReportsPrediccionService, HistorialPrediccion } from '../../services/reports-prediccion.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-history-academic-report',
  standalone: false,
  templateUrl: './history-academic-report.component.html',
  styleUrl: './history-academic-report.component.css'
})
export class HistoryAcademicReportComponent implements OnInit {
  columnas: string[] = ['Codigo_estudiante', 'curso', 'trimestre', 'asistencia', 'nota', 'conducta', 'rendimiento', 'observacion', 'mensaje_umbral', 'acciones'/*, 'fecha_prediccion'*/];
  historialCompleto: HistorialPrediccion[] = [];
  historialFiltrado = new MatTableDataSource<HistorialPrediccion>();

  trimestreSeleccionado: number | '' = '';
  codigoFiltro: string = '';
  cursoFiltro: string = '';
  rendimientoDatos: (number | null)[] = [];
  rendimientoTexto = ['Bajo', 'Medio', 'Alto'];

  codigosEstudiantes: string[] = [];
  cursosDisponibles: string[] = [];

  trimestres: number[] = [1, 2, 3];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportsPrediccionService,
    private router: Router
  ) {}

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Primer trimestre', 'Segundo trimestre', 'Tercer trimestre'],
    datasets: [
      {
        data: [],
        label: 'Nota del Trimestre',
        borderColor: '#3f51b5',
        fill: false
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        align: 'top',
        anchor: 'end',
        color: '#f44336',
        font: {
          weight: 'bold'
        },
        formatter: (value, ctx) => {
          const rendimiento = this.rendimientoDatos[ctx.dataIndex];
          return rendimiento !== null && rendimiento !== undefined
            ? this.rendimientoTexto[rendimiento - 1]
            : '';
        }
      }
    },
    scales: {
      x: {
        offset: true, // 🔹 Agrega margen para separar los puntos de los bordes
        ticks: {
          padding: 10 // Ajusta el espacio entre etiquetas y los puntos
        }
      },
      y: {
        min: 0,
        max: 25
      }
    }
  };

  verNotas(idEstudiante: number): void {
    if (!idEstudiante) {
      console.error('ID de estudiante no definido');
      return;
    }

    this.router.navigate(['/notas', idEstudiante]);
  }
  actualizarGrafico() {
    const datos = this.historialCompleto
      .filter(p => p.Codigo_estudiante === this.codigoFiltro && p.curso === this.cursoFiltro)
      .sort((a, b) => a.trimestre - b.trimestre);

    const notas: (number | null)[] = [null, null, null];
    this.rendimientoDatos = [null, null, null]; // Asegurar que se reinicie antes de llenarlo

    datos.forEach(item => {
      notas[item.trimestre - 1] = item.nota;
      this.rendimientoDatos[item.trimestre - 1] =
        item.rendimiento === 'Bajo' ? 1 : item.rendimiento === 'Medio' ? 2 : 3;
    });

    this.lineChartData.datasets[0].data = notas;

    // 👇 Fuerza el redibujado del gráfico
    setTimeout(() => this.chart?.update(), 100);
  }

  ngOnInit(): void {
    this.cargarHistorial();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chart?.update();
    }, 0);
  }


  cargarHistorial(): void {
    this.reportService.obtenerHistorialPredicciones().subscribe({
      next: (data) => {
        this.historialCompleto = data;

        // Cargar valores únicos para los filtros
        this.codigosEstudiantes = Array.from(new Set(data.map(d => d.Codigo_estudiante)));
        this.cursosDisponibles = Array.from(new Set(data.map(d => d.curso)));

        this.filtrarHistorial();
      },
      error: (err) => {
        console.error('Error al obtener historial', err);
      }
    });
  }

  filtrarHistorial(): void {
    let filtrado = this.historialCompleto;

    if (this.trimestreSeleccionado !== '') {
      filtrado = filtrado.filter(p => p.trimestre === Number(this.trimestreSeleccionado));
    }

    if (this.codigoFiltro !== '') {
      filtrado = filtrado.filter(p => p.Codigo_estudiante === this.codigoFiltro);
    }

    if (this.cursoFiltro !== '') {
      filtrado = filtrado.filter(p => p.curso === this.cursoFiltro);
    }

    this.historialFiltrado = new MatTableDataSource(filtrado);
    this.historialFiltrado.paginator = this.paginator;
    this.historialFiltrado.sort = this.sort;

    // 🔁 Llamar gráfico solo si filtros están definidos
    if (this.codigoFiltro !== '' && this.cursoFiltro !== '') {
      this.actualizarGrafico();
    }
  }


  limpiarFiltros(): void {
    this.trimestreSeleccionado = '';
    this.codigoFiltro = '';
    this.cursoFiltro = '';
    this.filtrarHistorial();

    // 🔁 Limpiar gráfico
    this.lineChartData.datasets[0].data = [];
    this.chart?.update();
  }

  exportarPDF(): void {
    const doc = new jsPDF('l', 'mm', 'a4');

    // Agrega la tabla
    autoTable(doc, {
      head: [[
        'Código', 'Curso', 'Trimestre', 'Asistencia',
        'Nota', 'Conducta', 'Rendimiento', 'Observación', 'Proyeccion y/o Resultados'
      ]],
      body: this.historialFiltrado.data.map(r => [
        r.Codigo_estudiante, r.curso, r.trimestre,
        r.asistencia, r.nota, r.conducta,
        r.rendimiento, r.observacion
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
      startY: 15
    });

    // Usar posición fija si `previous` no está disponible
    const graphOffsetY = 90; // ← Ajusta este valor si es necesario

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, graphOffsetY, 250, 80); // ← ajusta ancho y alto
    }

    doc.save('historial_academico_horizontal.pdf');
  }

  exportarExcel() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(this.historialFiltrado.filteredData);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Académico');

    // Guardar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, 'Historial_Academico.xlsx');
  }
}

