import { Component, Inject, OnInit } from '@angular/core';
import { RegisterNotesService, RendimientoAcademico } from '../../services/register-notes.service';
import { NotasEventService } from '../../services/notas-event.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RendimientoDetalleComponent } from '../rendimiento-detalle/rendimiento-detalle.component';


@Component({
  selector: 'app-academic-records-students',
  standalone: false,
  templateUrl: './academic-records-students.component.html',
  styleUrl: './academic-records-students.component.css'
})
export class AcademicRecordsStudentsComponent implements OnInit{
  displayedColumns: string[] = [
    'curso', 'trimestre', 'asistencia', 'nota_trimestre', 'conducta','acciones', 'rendimiento', 'resultados_prediccion'
  ];
  notas: RendimientoAcademico[] = [];
  estudianteId!: number;
  cargandoDatos: boolean = false;
  mensajeCarga: string = "Preparando datos...";
  pasosCarga: string[] = [
    "Recopilando asistencia...",
    "Procesando notas...",
    "Analizando conducta...",
    "Obteniendo información de padres...",
    "Verificando condiciones laborales...",
    "Generando predicción de rendimiento..."
  ];
  constructor(private route: ActivatedRoute, private notesService: RegisterNotesService, private dialog: MatDialog, private notasEventService: NotasEventService ) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));
    this.notesService.obtenerNotasPorEstudiante(this.estudianteId).subscribe({
      next: (res) => {
      this.notas = res;
    },});
  }

  iniciarPrediccion(): void {
  this.cargandoDatos = true;
  let index = 0;

  let intervalo = setInterval(() => {
    this.mensajeCarga = this.pasosCarga[index];
    index++;
    if (index >= this.pasosCarga.length) clearInterval(intervalo);
  }, 1200);

  setTimeout(() => {
    this.notas.forEach(nota => this.predecirRendimiento(nota));
    this.cargandoDatos = false;
  }, Math.max(this.pasosCarga.length * 1200, 3000)); // Garantiza al menos 3 segundos de carga
}



confirmarEdicion(nota: RendimientoAcademico): void {
  if (confirm('¿Estás seguro de aplicar los cambios?')) {
      this.notesService.actualizarNota(nota.id, nota).subscribe({
        next: () => {
          alert('Cambios aplicados correctamente');

          // Oculta la barra de progreso eliminando el valor de rendimiento
          nota.rendimiento = undefined;

          // Muestra una ventana emergente pidiendo volver a predecir
          alert('Debes volver a predecir el rendimiento para actualizar los datos.');
          this.notasEventService.emitirCambio();
        },
        error: err => {
          console.error(err);
          alert('Error al actualizar la nota');
        }
      });
    }
  }


  eliminarNota(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      this.notesService.eliminarNota(id).subscribe({
        next: () => {
          alert('Nota eliminada');
          this.notas = this.notas.filter(n => n.id !== id);
          this.notasEventService.emitirCambio();
        },
        error: err => {
          console.error(err);
          alert('Error al eliminar la nota');
        }
      });
    }
  }

  predecirRendimiento(nota: RendimientoAcademico): void {
  this.notesService.predecirRendimiento(this.estudianteId, nota).subscribe({
    next: (res) => {
      nota.rendimiento = res.rendimiento;
      nota.factores_riesgo = res.factores_riesgo;
      nota.Mensaje_riesgo = res.Mensaje_riesgo;
    },
    error: err => {
      console.error(err);
      alert('Error al predecir rendimiento');
    }
  });
  }
  abrirDetalle(nota: RendimientoAcademico): void {
    this.dialog.open(RendimientoDetalleComponent, {
      data: {
        rendimiento: nota.rendimiento,
        factores_riesgo: nota.factores_riesgo,
        observacion_final: nota.Mensaje_riesgo
      }
    });
  }
  getRendimientoValor(rendimiento: string): number {
    if (rendimiento === "Alto") return 100; // Máximo progreso
    else if (rendimiento === "Medio") return 50; // Nivel medio
    else return 20; // Bajo rendimiento
  }

  getProgressColor(rendimiento: string): string {
    if (rendimiento === "Alto") return '#4CAF50';  // Verde
    else if (rendimiento === "Medio") return '#FFC107';  // Amarillo
    else return '#F44336';  // Rojo
  }

  cursos: string[] = [
  'Ciencia y Tecnología',
  'Comunicación',
  'Matemática',
  'Personal Social',
  'Educación Física',
  'Arte y Cultura',
  'Educación Religiosa',
  'Competencias Transversales'
  ];
}
