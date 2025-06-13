import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotasEventService {
  private notaCambiadaSource = new Subject<void>();

  // Observable para que los componentes se suscriban
  notaCambiada$ = this.notaCambiadaSource.asObservable();

  // Método para emitir el evento
  emitirCambio() {
    this.notaCambiadaSource.next();
  }
}
