export interface Notificacion {
  id: number;
  titulo: string;
  mensaje?: string;
  tipo: string;
  leida: boolean;
  fecha: string;
}
