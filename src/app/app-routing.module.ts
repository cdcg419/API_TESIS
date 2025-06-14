import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EditUserComponent } from './pages/edit-user/edit-user.component';
import { RegisterStudentComponent } from './pages/register-student/register-student.component';
import { MyStudentsComponent } from './pages/my-students/my-students.component';
import { RegisterNotesComponent } from './pages/register-notes/register-notes.component';
import { EditStudentComponent } from './pages/edit-student/edit-student.component';
import { AcademicRecordsStudentsComponent } from './pages/academic-records-students/academic-records-students.component';
import { ReportsStudentsComponent } from './pages/reports-students/reports-students.component';
import { MonthReportComponent } from './pages/month-report/month-report.component';
import { AcademicRiskReportComponent } from './pages/academic-risk-report/academic-risk-report.component';
import { HistoryAcademicReportComponent } from './pages/history-academic-report/history-academic-report.component';
import { AuthGuard } from './guard/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
  { path: 'edit_user', component: EditUserComponent, canActivate: [AuthGuard]},
  { path: 'register_student', component: RegisterStudentComponent, canActivate: [AuthGuard] },
  { path: 'my_students', component: MyStudentsComponent, canActivate: [AuthGuard] },
  { path: 'register_notes_for_students', component: RegisterNotesComponent, canActivate: [AuthGuard] },
  { path: 'edit-student/:id', component: EditStudentComponent, canActivate: [AuthGuard] },
  { path: 'notas/:id', component:AcademicRecordsStudentsComponent, canActivate: [AuthGuard] },
  { path: 'reports_students', component:ReportsStudentsComponent, canActivate: [AuthGuard] },
  { path: 'monthly_reports', component:MonthReportComponent, canActivate: [AuthGuard] },
  { path: 'risk_reports', component:AcademicRiskReportComponent, canActivate: [AuthGuard] },
{ path: 'historial-academico/:id', component: HistoryAcademicReportComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
