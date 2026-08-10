package com.voltiosyruedas.taller.common.exception;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private T datos;
    private String mensaje;
    private LocalDateTime timestamp;
    private String path;

    public static <T> ApiResponse<T> ok(T datos, String mensaje) {
        return ApiResponse.<T>builder()
                .datos(datos)
                .mensaje(mensaje)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> ok(T datos) {
        return ok(datos, "Operación completada exitosamente");
    }
}