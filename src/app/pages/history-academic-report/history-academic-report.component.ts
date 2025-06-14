import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { ReportsPrediccionService, HistorialPrediccion } from '../../services/reports-prediccion.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';


@Component({
  selector: 'app-history-academic-report',
  standalone: false,
  templateUrl: './history-academic-report.component.html',
  styleUrl: './history-academic-report.component.css'
})
export class HistoryAcademicReportComponent implements OnInit {
  columnas: string[] = ['Codigo_estudiante', 'curso', 'trimestre', 'asistencia', 'nota', 'conducta', 'rendimiento'/*, 'fecha_prediccion'*/];
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
    private reportService: ReportsPrediccionService
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
}

