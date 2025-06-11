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

  toggleReports_month() {
    this.showReports_month = !this.showReports_month;
    if (this.showReports_month) {
      this.showReports_warning = false; // Asegura que el otro se cierre
    }
  }
  toggleReports_warning() {
    this.showReports_warning = !this.showReports_warning;
    if (this.showReports_warning) {
      this.showReports_month = false; // Asegura que el otro se cierre
    }
  }

}
