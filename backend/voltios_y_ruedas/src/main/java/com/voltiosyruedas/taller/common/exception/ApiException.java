package com.voltiosyruedas.taller.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Excepción de negocio tipada que transporta el código HTTP que el manejador
 * global debe devolver al cliente.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    private ApiException(HttpStatus status, String codigo, String mensaje) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
    }

    public static ApiException unauthorized(String mensaje) {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", mensaje);
    }

    public static ApiException conflict(String mensaje) {
        return new ApiException(HttpStatus.CONFLICT, "CONFLICT", mensaje);
    }

    public static ApiException notFound(String mensaje) {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", mensaje);
    }

    public static ApiException badRequest(String mensaje) {
        return new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", mensaje);
    }

    public static ApiException forbidden(String mensaje) {
        return new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", mensaje);
    }
}
