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
  reportes: ReportePrediccion[] = [];
  cursos: string[] = [];
  trimestres: number[] = [1, 2, 3];

  cursoSeleccionado: string = '';
  trimestreSeleccionado: number | '' = '';

  constructor(private reportsService: ReportsPrediccionService) {}

  ngOnInit(): void {
    this.reportsService.obtenerReportes().subscribe({
      next: (data) => {
        this.reportes = data;
        this.cursos = [...new Set(data.map(r => r.curso))];
      },
      error: (err) => {
        console.error('Error al obtener reportes', err);
      }
    });
  }
  get reportesFiltrados() {
    return this.reportes.filter(r =>
      (!this.cursoSeleccionado || r.curso === this.cursoSeleccionado) &&
      (!this.trimestreSeleccionado || r.trimestre === this.trimestreSeleccionado)
    );
  }
  exportarExcel(): void {
  const data = this.reportesFiltrados.map(r => ({
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
    body: this.reportesFiltrados.map(r => [
      r.codigo_estudiante, r.curso, r.trimestre,
      r.asistencia, r.nota_trimestre, r.conducta,
      r.rendimiento, r.observacion
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [76, 175, 80] } // Verde #4CAF50
  });

  doc.save('reporte_prediccion.pdf');
  }
}
