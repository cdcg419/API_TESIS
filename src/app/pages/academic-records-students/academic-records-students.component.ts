import { Component, Inject, OnInit } from '@angular/core';
import { RegisterNotesService, RendimientoAcademico } from '../../services/register-notes.service';
import { NotasEventService } from '../../services/notas-event.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RendimientoDetalleComponent } from '../rendimiento-detalle/rendimiento-detalle.component';

interface RendimientoEditable extends RendimientoAcademico {
  editando: boolean;
  _original?: {
    curso: string;
    trimestre: number;
    asistencia: number;
    nota_trimestre: number;
    conducta: number;
  };
}

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
  notas: RendimientoEditable[] = [];
  estudianteId!: number;
  cargandoDatos: boolean = false;
  cursoFiltrado: string = '';
  notasFiltradas: RendimientoEditable[] = [];
  mensajeCarga: string = "Preparando datos...";
  pasosCarga: string[] = [
    "Recopilando asistencia...",
    "Procesando notas...",
    "Analizando conducta...",
    "Obteniendo información de padres...",
    "Verificando condiciones laborales...",
    "Generando predicción de rendimiento..."
  ];
  codigoEstudiante: string = '';
  presenciaPadres: string = '';
  trabaja: boolean = false;
  mensajeSinDatos: string = '';
  mensajeErrorCarga: string = '';


  constructor(private route: ActivatedRoute, private notesService: RegisterNotesService, private dialog: MatDialog, private notasEventService: NotasEventService ) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));

    // Suscribirse a cambios emitidos desde notasEventService
    this.notasEventService.cambios$.subscribe(() => {
      this.recargarNotas(); // vuelve a consultar las notas
    });

    // Cargar notas iniciales
    this.notesService.obtenerNotasPorEstudiante(this.estudianteId).subscribe({
      next: (res) => {
        this.notas = res.map(n => ({ ...n, editando: false }));
        this.filtrarNotasPorCurso();

        this.mensajeSinDatos = '';
        this.mensajeErrorCarga = '';

        if (this.notas.length === 0) {
          this.mensajeSinDatos = 'No se encontraron datos para los criterios seleccionados.';
        } else {
          this.iniciarPrediccion();
        }
      },
      error: err => {
        console.error('Error al cargar las notas del estudiante:', err);
        this.mensajeErrorCarga = 'Error al generar el historial académico. Intente de nuevo.';
      }
    });

    // Obtener datos del estudiante
    const docenteId = localStorage.getItem('userId');
    if (docenteId) {
      this.notesService.obtenerEstudiantesPorDocente(+docenteId).subscribe({
        next: (data) => {
          const estudiante = data.find(e => e.id === this.estudianteId);
          if (estudiante) {
            this.codigoEstudiante = estudiante.Codigo_estudiante;
            this.presenciaPadres = estudiante.presencia_padres;
            this.trabaja = estudiante.trabaja;
          }
        },
        error: (err) => {
          console.error('Error al obtener estudiantes', err);
        }
      });
    }
  }

  filtrarNotasPorCurso(): void {
    this.notasFiltradas = this.cursoFiltrado
      ? this.notas.filter(n => n.curso === this.cursoFiltrado)
      : this.notas;
    if (this.notasFiltradas.length === 0 && this.notas.length > 0) {
      this.mensajeSinDatos = 'No se encontraron datos para los criterios seleccionados.';
    } else {
      this.mensajeSinDatos = '';
    }
  }
  validarPrediccion(): void {
    if (this.notas.length === 0) {
      alert('Error al procesar la predicción. Intente nuevamente.');
      return;
    }
    this.iniciarPrediccion();
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
    }, Math.max(this.pasosCarga.length * 1200, 3000));
  }

  recargarNotas(): void {
    this.notesService.obtenerNotasPorEstudiante(this.estudianteId).subscribe({
      next: (res) => {
        this.notas = res.map(n => ({ ...n, editando: false }));
        this.filtrarNotasPorCurso();
      },
      error: err => {
        console.error('Error al recargar notas', err);
      }
    });
  }

  confirmarEdicion(nota: RendimientoEditable): void {
    if (!this.validarNota(nota)) {
      alert('Hay campos inválidos. Corrige los errores antes de guardar.');
      return;
    }

    if (confirm('¿Estás seguro de aplicar los cambios?')) {
      this.notesService.actualizarNota(nota.id, nota).subscribe({
        next: () => {
          alert('Cambios aplicados correctamente');
          nota.rendimiento = undefined;
          alert('Debes volver a predecir el rendimiento para actualizar los datos.');
          nota.editando = false;
        },
        error: err => {
          console.error(err);
          alert('Error al actualizar la nota');
        }
      });
    }
  }

  validarNota(nota: RendimientoEditable): boolean {
    return (
      typeof nota.curso === 'string' && nota.curso.trim() !== '' &&
      Number(nota.trimestre) >= 1 && Number(nota.trimestre) <= 3 &&
      Number(nota.asistencia) >= 1 && Number(nota.asistencia) <= 100 &&
      Number(nota.nota_trimestre) >= 1 && Number(nota.nota_trimestre) <= 20 &&
      Number(nota.conducta) >= 1 && Number(nota.conducta) <= 20
    );
  }


  eliminarNota(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      this.notesService.eliminarNota(id).subscribe({
        next: () => {
          alert('Nota eliminada');

          // Elimina la nota del array local
          this.notas = this.notas.filter(n => n.id !== id);

          // Aplica el filtro nuevamente
          this.filtrarNotasPorCurso();
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
      nota.mensaje_umbral = res.mensaje_umbral;
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
        observacion_final: nota.Mensaje_riesgo,
        mensaje_umbral_final: nota.mensaje_umbral
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

  activarEdicion(nota: RendimientoEditable): void {
    this.notas.forEach(n => n.editando = false);
    nota.editando = true;

    // Guarda solo los campos editables
    nota._original = {
      curso: nota.curso,
      trimestre: nota.trimestre,
      asistencia: nota.asistencia,
      nota_trimestre: nota.nota_trimestre,
      conducta: nota.conducta
    };
  }

  cerrarEdicion(nota: RendimientoEditable): void {
    if (nota._original) {
      nota.curso = nota._original.curso;
      nota.trimestre = nota._original.trimestre;
      nota.asistencia = nota._original.asistencia;
      nota.nota_trimestre = nota._original.nota_trimestre;
      nota.conducta = nota._original.conducta;
      delete nota._original;
    }

    nota.editando = false;
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
