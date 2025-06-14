import { Component} from '@angular/core';

@Component({
  selector: 'app-reports-students',
  standalone: false,
  templateUrl: './reports-students.component.html',
  styleUrl: './reports-students.component.css'
})
export class ReportsStudentsComponent{
  showReports_month = false;
  showReports_warning = false;
  showReports_academic = false;

   activo: 'month' | 'warning' | 'academic' | null = null;

  toggleReports_month() {
    this.showReports_month = !this.showReports_month;
    if (this.showReports_month) {
      this.showReports_warning = false;
      this.showReports_academic = false;
      this.activo = this.showReports_month ? 'month' : null;
      // Asegura que el otro se cierre
    }
  }
  toggleReports_warning() {
    this.showReports_warning = !this.showReports_warning;
    if (this.showReports_warning) {
      this.showReports_month = false;
      this.showReports_academic = false;
      this.activo = this.showReports_warning ? 'warning' : null;
      // Asegura que el otro se cierre
    }
  }
  toggleReports_academic() {
    this.showReports_academic = !this.showReports_academic;
    if (this.showReports_academic) {
      this.showReports_month = false;
      this.showReports_warning = false;
      this.activo = this.showReports_academic ? 'academic' : null;
      // Asegura que el otro se cierre
    }
  }


}
