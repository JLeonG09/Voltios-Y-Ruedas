export interface PreferenciasRequest {
  tema?: string;
  idioma?: string;
  zonaHoraria?: string;
  notificacionesEmail?: boolean;
  notificacionesPush?: boolean;
  notificacionesReservas?: boolean;
  notificacionesOrdenes?: boolean;
  notificacionesStock?: boolean;
  dosFactores?: boolean;
  sesionTimeout?: number;
  logsActividad?: boolean;
}
