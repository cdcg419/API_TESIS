import { Component, OnInit } from '@angular/core';
import { ReportsPrediccionService, ReportePrediccion } from '../../services/reports-prediccion.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-month-report',
  standalone: false,
  templateUrl: './month-report.component.html',
  styleUrl: './month-report.component.css'
})
export class MonthReportComponent implements OnInit{
  displayedColumns: string[] = [
    'codigo_estudiante',
    'grado',
    'curso',
    'trimestre',
    'asistencia',
    'nota_trimestre',
    'conducta',
    'rendimiento',
    'observacion',
    'mensaje_umbral' // 🔹 Nueva columna
  ];
  dataSource = new MatTableDataSource<ReportePrediccion>();
  reportes: ReportePrediccion[] = [];
  cursos: string[] = [];
  codigosEstudiantes: string[] = [];
  codigosFiltrados: string[] = [];
  mostrarLista: boolean = false;
  trimestres: number[] = [1, 2, 3];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  codigoBusqueda: string = '';
  cursoSeleccionado: string = '';
  trimestreSeleccionado: number | '' = '';
  mesSeleccionado: number | '' = '';
  anioSeleccionado: number | '' = '';
  gradoSeleccionado: number | '' = '';
  grados = [
    { valor: 1, nombre: 'Primer Grado' },
    { valor: 2, nombre: 'Segundo Grado' },
    { valor: 3, nombre: 'Tercer Grado' },
    { valor: 4, nombre: 'Cuarto Grado' },
    { valor: 5, nombre: 'Quinto Grado' },
    { valor: 6, nombre: 'Sexto Grado' }
  ];
  mensajeSinDatos: string = '';
  mensajeError: string = '';
  tablaVaciaPorFiltro: boolean = false;

  //meses: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  mesesNombre: { valor: number, nombre: string }[] = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];
  anios: number[] = [];

  constructor(private reportsService: ReportsPrediccionService) {}

  ngOnInit(): void {
    this.cargarReportes();
  }
  cargarReportes(): void {
    this.reportsService.obtenerReportes(
      this.mesSeleccionado ? +this.mesSeleccionado : undefined,
      this.anioSeleccionado ? +this.anioSeleccionado : undefined,
      this.gradoSeleccionado ? +this.gradoSeleccionado : undefined
    ).subscribe({
      next: (data) => {
        this.reportes = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Limpiar mensajes previos
        this.mensajeSinDatos = '';
        this.mensajeError = '';

        // Mostrar mensaje si no hay datos
        if (data.length === 0) {
          this.mensajeSinDatos = 'No se encontraron datos para los filtros seleccionados.';
        }

        // Opciones para selects
        this.cursos = [...new Set(data.map(r => r.curso))];
        this.anios = [...new Set(data.map(r => new Date(r.fecha_registro!).getFullYear()))];
        this.codigosEstudiantes = [...new Set(data.map(r => r.codigo_estudiante))];
      },
      error: (err) => {
        console.error('Error al generar el reporte:', err);
        this.mensajeError = 'Error al generar el reporte. Intente de nuevo.';
      }
    });
  }
  get reportesFiltrados() {
    return this.reportes.filter(r =>
      (!this.cursoSeleccionado || r.curso === this.cursoSeleccionado) &&
      (!this.trimestreSeleccionado || r.trimestre === this.trimestreSeleccionado) &&
      (!this.mesSeleccionado || new Date(r.fecha_registro!).getMonth() + 1 === this.mesSeleccionado) &&
      (!this.anioSeleccionado || new Date(r.fecha_registro!).getFullYear() === this.anioSeleccionado)
    );
  }

  aplicarFiltro(): void {
    this.dataSource.filterPredicate = (data: ReportePrediccion, filter: string) => {
      const [curso, trimestre, mes, anio, codigo, grado] = filter.split('|');
      const cumpleCurso = !curso || data.curso === curso;
      const cumpleTrimestre = !trimestre || data.trimestre.toString() === trimestre;
      const cumpleMes = !mes || new Date(data.fecha_registro!).getMonth() + 1 === +mes;
      const cumpleAnio = !anio || new Date(data.fecha_registro!).getFullYear() === +anio;
      const cumpleCodigo = !codigo || data.codigo_estudiante === codigo;
      const cumpleGrado = !grado || data.grado?.toString() === grado;

      return cumpleCurso && cumpleTrimestre && cumpleMes && cumpleAnio && cumpleCodigo && cumpleGrado;
    };

    const filtro = `${this.cursoSeleccionado}|${this.trimestreSeleccionado}|${this.mesSeleccionado}|${this.anioSeleccionado}|${this.codigoBusqueda}|${this.gradoSeleccionado}`;
    this.dataSource.filter = filtro;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // Verificar si la tabla está vacía por el filtro
    this.tablaVaciaPorFiltro = this.dataSource.filteredData.length === 0;
  }

  filtrarCodigos(): void {
    const termino = this.codigoBusqueda.toLowerCase();
    this.codigosFiltrados = this.codigosEstudiantes.filter(codigo =>
      codigo.toLowerCase().includes(termino)
    );
    this.mostrarLista = true;
  }

  seleccionarCodigo(codigo: string): void {
    this.codigoBusqueda = codigo;
    this.mostrarLista = false;
    this.aplicarFiltro();
  }

  ocultarListaConDelay(): void {
    setTimeout(() => this.mostrarLista = false, 150);
  }


  exportarExcel(): void {
    const data = this.dataSource.filteredData.map(r => ({
      'Código': r.codigo_estudiante,
      'Grado' : r.grado,
      'Curso': r.curso,
      'Trimestre': r.trimestre,
      'Asistencia': r.asistencia,
      'Nota Trimestre': r.nota_trimestre,
      'Conducta': r.conducta,
      'Rendimiento': r.rendimiento,
      'Observación': r.observacion,
      'Proyecciones y/o Resultados': r.mensaje_umbral
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'Reporte': worksheet }, SheetNames: ['Reporte'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'reporte_prediccion.xlsx');
  }

  exportarPDF(): void {
    const doc = new jsPDF('l', 'mm', 'a4');

    autoTable(doc, {
      head: [[
        'Código', 'Grado', 'Curso', 'Trimestre', 'Asistencia',
        'Nota', 'Conducta', 'Rendimiento', 'Observación', 'Proyecciones y/o Resultados'
      ]],
      body: this.dataSource.filteredData.map(r => [
        r.codigo_estudiante, r.curso, r.trimestre,
        r.asistencia, r.nota_trimestre, r.conducta,
        r.rendimiento, r.observacion
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] }
    });

    doc.save('reporte_prediccion.pdf');
  }
  limpiarFiltros() {
    this.cursoSeleccionado = '';
    this.trimestreSeleccionado = '';
    this.mesSeleccionado = '';
    this.anioSeleccionado = '';
    this.codigoBusqueda = '';
    this.gradoSeleccionado = '';
    this.aplicarFiltro();
  }
}
