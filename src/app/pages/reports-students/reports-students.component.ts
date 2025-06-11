import { Component, OnInit } from '@angular/core';
import { ReportsPrediccionService, ReportePrediccion } from '../../services/reports-prediccion.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, AfterViewInit } from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-reports-students',
  standalone: false,
  templateUrl: './reports-students.component.html',
  styleUrl: './reports-students.component.css'
})
export class ReportsStudentsComponent implements OnInit{
  displayedColumns: string[] = ['codigo_estudiante', 'curso', 'trimestre', 'asistencia', 'nota_trimestre', 'conducta', 'rendimiento', 'observacion'];
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

  meses: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  anios: number[] = [];

  constructor(private reportsService: ReportsPrediccionService) {}

  ngOnInit(): void {
    this.cargarReportes();
  }
  cargarReportes(): void {
    this.reportsService.obtenerReportes(
      this.mesSeleccionado ? +this.mesSeleccionado : undefined,
      this.anioSeleccionado ? +this.anioSeleccionado : undefined
    ).subscribe({
      next: (data) => {
        this.reportes = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Opciones para selects
        this.cursos = [...new Set(data.map(r => r.curso))];
        this.anios = [...new Set(data.map(r => new Date(r.fecha_registro!).getFullYear()))];
        this.codigosEstudiantes = [...new Set(data.map(r => r.codigo_estudiante))]; // Extrae códigos únicos
      },
      error: (err) => {
        console.error('Error al obtener reportes', err);
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
      const [curso, trimestre, mes, anio, codigo] = filter.split('|');
      const cumpleCurso = !curso || data.curso === curso;
      const cumpleTrimestre = !trimestre || data.trimestre.toString() === trimestre;
      const cumpleMes = !mes || new Date(data.fecha_registro!).getMonth() + 1 === +mes;
      const cumpleAnio = !anio || new Date(data.fecha_registro!).getFullYear() === +anio;
      const cumpleCodigo = !codigo || data.codigo_estudiante === codigo;

      return cumpleCurso && cumpleTrimestre && cumpleMes && cumpleAnio && cumpleCodigo;
    };

    const filtro = `${this.cursoSeleccionado}|${this.trimestreSeleccionado}|${this.mesSeleccionado}|${this.anioSeleccionado}|${this.codigoBusqueda}`;
    this.dataSource.filter = filtro;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
      'Curso': r.curso,
      'Trimestre': r.trimestre,
      'Asistencia': r.asistencia,
      'Nota Trimestre': r.nota_trimestre,
      'Conducta': r.conducta,
      'Rendimiento': r.rendimiento,
      'Observación': r.observacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'Reporte': worksheet }, SheetNames: ['Reporte'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'reporte_prediccion.xlsx');
  }

  exportarPDF(): void {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [[
        'Código', 'Curso', 'Trimestre', 'Asistencia',
        'Nota', 'Conducta', 'Rendimiento', 'Observación'
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
    this.aplicarFiltro();
  }
}
