import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-reports-students',
  standalone: false,
  templateUrl: './reports-students.component.html',
  styleUrl: './reports-students.component.css'
})
export class ReportsStudentsComponent implements OnInit{
  showReports_month = false;
  showReports_warning = false;
  showReports_academic = false;
  showReports_ranking = false;

  activo: 'month' | 'warning' | 'academic' | 'ranking' | null = null;


  ngOnInit(): void {
    this.showReports_academic = !this.showReports_academic;
    if (this.showReports_academic) {
      this.showReports_month = false;
      this.showReports_warning = false;
      this.showReports_ranking = false;
      this.activo = this.showReports_academic ? 'academic' : null;
      // Asegura que el otro se cierre
    }
  }

  toggleReports_month() {
    this.showReports_month = !this.showReports_month;
    if (this.showReports_month) {
      this.showReports_warning = false;
      this.showReports_academic = false;
      this.showReports_ranking = false;
      this.activo = this.showReports_month ? 'month' : null;
      // Asegura que el otro se cierre
    }
  }
  toggleReports_warning() {
    this.showReports_warning = !this.showReports_warning;
    if (this.showReports_warning) {
      this.showReports_month = false;
      this.showReports_academic = false;
      this.showReports_ranking = false;
      this.activo = this.showReports_warning ? 'warning' : null;
      // Asegura que el otro se cierre
    }
  }
  toggleReports_academic() {
    this.showReports_academic = !this.showReports_academic;
    if (this.showReports_academic) {
      this.showReports_month = false;
      this.showReports_warning = false;
      this.showReports_ranking = false;
      this.activo = this.showReports_academic ? 'academic' : null;
      // Asegura que el otro se cierre
    }
  }

  toggleReports_ranking() {
    this.showReports_ranking = !this.showReports_ranking;
    if (this.showReports_ranking) {
      this.showReports_month = false;
      this.showReports_warning = false;
      this.showReports_academic = false;
      this.activo = 'ranking';
    } else {
      this.activo = null;
    }
  }

}
