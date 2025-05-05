import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';  // Asegúrate de importar el servicio

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token desde el servicio AuthService
    const token = this.authService.getToken();

    if (token) {
      // Si hay un token, lo agregamos al encabezado de la solicitud
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`  // El formato de autorización estándar
        }
      });

      return next.handle(cloned);  // Pasamos la solicitud clonada con el token
    }

    return next.handle(req);  // Si no hay token, la solicitud se pasa sin modificar
  }
}
