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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
