import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotasEventService {
  private notaCambiadaSource = new Subject<void>();
  private cambiosSubject = new Subject<void>();
  cambios$ = this.cambiosSubject.asObservable();


  // Observable para que los componentes se suscriban
  notaCambiada$ = this.notaCambiadaSource.asObservable();

  // Método para emitir el evento
  emitirCambio(): void {
    this.cambiosSubject.next();
  }
}
