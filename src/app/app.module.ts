import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EditUserComponent } from './pages/edit-user/edit-user.component';
import { RegisterStudentComponent } from './pages/register-student/register-student.component';
import { HomeComponent } from './pages/home/home.component';
import { MyStudentsComponent } from './pages/my-students/my-students.component';
import { RegisterNotesComponent } from './pages/register-notes/register-notes.component';
//
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms'
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
//
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { EditStudentComponent } from './pages/edit-student/edit-student.component';
import { AcademicRecordsStudentsComponent } from './pages/academic-records-students/academic-records-students.component';
import { RendimientoDetalleComponent } from './pages/rendimiento-detalle/rendimiento-detalle.component';
import { ReportsStudentsComponent } from './pages/reports-students/reports-students.component';
import { MonthReportComponent } from './pages/month-report/month-report.component';
import { AcademicRiskReportComponent } from './pages/academic-risk-report/academic-risk-report.component';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    DashboardComponent,
    EditUserComponent,
    RegisterStudentComponent,
    MyStudentsComponent,
    RegisterNotesComponent,
    EditStudentComponent,
    AcademicRecordsStudentsComponent,
    RendimientoDetalleComponent,
    ReportsStudentsComponent,
    MonthReportComponent,
    AcademicRiskReportComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatButtonModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSidenavModule,
    BaseChartDirective
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor, // Usamos el interceptor
      multi: true // Permite agregar múltiples interceptores
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
