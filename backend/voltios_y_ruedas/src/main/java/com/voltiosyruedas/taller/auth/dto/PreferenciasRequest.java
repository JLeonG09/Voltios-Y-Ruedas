package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Preferencias de configuración del usuario")
public class PreferenciasRequest {
    @Schema(description = "Tema seleccionado: light, dark o system", example = "system")
    private String tema;

    @Schema(description = "Idioma de la aplicación", example = "es")
    private String idioma;

    @Schema(description = "Zona horaria del usuario", example = "America/Costa_Rica")
    private String zonaHoraria;

    @Schema(description = "Recibir notificaciones por email")
    private Boolean notificacionesEmail;

    @Schema(description = "Recibir notificaciones push")
    private Boolean notificacionesPush;

    @Schema(description = "Notificar nuevas reservas")
    private Boolean notificacionesReservas;

    @Schema(description = "Notificar cambios de órdenes de trabajo")
    private Boolean notificacionesOrdenes;

    @Schema(description = "Notificar stock bajo")
    private Boolean notificacionesStock;

    @Schema(description = "Autenticación de dos factores")
    private Boolean dosFactores;

    @Schema(description = "Tiempo de cierre de sesión por inactividad (minutos)", example = "60")
    private Integer sesionTimeout;

    @Schema(description = "Registrar logs de actividad")
    private Boolean logsActividad;
}
