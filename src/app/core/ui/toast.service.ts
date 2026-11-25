import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastCtrl = inject(ToastController);

  async exito(mensaje: string): Promise<void> {
    await this.mostrar(mensaje, 'success', 2800);
  }

  async error(mensaje: string): Promise<void> {
    await this.mostrar(mensaje, 'danger', 4000);
  }

  async advertencia(mensaje: string): Promise<void> {
    await this.mostrar(mensaje, 'warning', 3500);
  }

  private async mostrar(message: string, color: 'success' | 'danger' | 'warning', duration: number): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration,
      position: 'bottom',
    });
    await toast.present();
  }
}
