package com.voltiosyruedas.taller.notificaciones.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Respuesta de notificación sin el objeto Usuario completo: solo expone lo
 * necesario al frontend y evita filtrar email, teléfono, dirección, preferencias
 * o el estado de la cuenta del destinatario.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionResponse {
    private Long id;
    private String titulo;
    private String mensaje;
    private String tipo;
    private Boolean leida;
    private LocalDateTime fecha;
}