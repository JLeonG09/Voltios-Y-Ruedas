package com.voltiosyruedas.taller.auth.security;

import com.voltiosyruedas.taller.common.exception.ApiException;
import com.voltiosyruedas.taller.common.exception.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.put(error.getField(), error.getDefaultMessage());
        }

        List<String> detalles = errores.entrySet().stream()
                .map(e -> "Campo '" + e.getKey() + "': " + e.getValue())
                .collect(Collectors.toList());

        ErrorResponse response = ErrorResponse.builder()
                .código("VALIDATION_ERROR")
                .mensaje("Datos de entrada inválidos")
                .detalles(detalles)
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errores = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String field = violation.getPropertyPath().toString();
            errores.put(field, violation.getMessage());
        });

        List<String> detalles = errores.entrySet().stream()
                .map(e -> "Campo '" + e.getKey() + "': " + e.getValue())
                .collect(Collectors.toList());

        ErrorResponse response = ErrorResponse.builder()
                .código("VALIDATION_ERROR")
                .mensaje("Restricciones violadas")
                .detalles(detalles)
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        logger.error("Violación de integridad de datos", ex);

        String detalle = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : null;
        String mensaje;
        if (detalle != null && detalle.contains("duplicate key")) {
            mensaje = "El recurso ya está registrado";
        } else if (detalle != null && detalle.contains("foreign key")) {
            mensaje = "No se puede eliminar: existen registros relacionados";
        } else {
            mensaje = "Conflicto de datos";
        }

        ErrorResponse response = ErrorResponse.builder()
                .código("DATA_INTEGRITY_ERROR")
                .mensaje(mensaje)
                .detalles(List.of(mensaje))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        logger.warn("Entidad no encontrada: {}", ex.getClass().getSimpleName());
        ErrorResponse response = ErrorResponse.builder()
                .código("NOT_FOUND")
                .mensaje("Recurso no encontrado")
                .detalles(List.of("Recurso no encontrado"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        ErrorResponse response = ErrorResponse.builder()
                .código("UNAUTHORIZED")
                .mensaje("Credenciales inválidas")
                .detalles(List.of("El email o la contraseña son incorrectos"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponse response = ErrorResponse.builder()
                .código("FORBIDDEN")
                .mensaje("Acceso denegado")
                .detalles(List.of("No tiene permisos para realizar esta acción"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Argumento inválido (no se expone mensaje técnico al cliente)");
        ErrorResponse response = ErrorResponse.builder()
                .código("BAD_REQUEST")
                .mensaje("Solicitud inválida")
                .detalles(List.of("Solicitud inválida"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        ErrorResponse response = ErrorResponse.builder()
                .código(ex.getCodigo())
                .mensaje(ex.getMessage())
                .detalles(List.of(ex.getMessage()))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(ClassCastException.class)
    public ResponseEntity<ErrorResponse> handleClassCastException(ClassCastException ex) {
        logger.error("Error de conversión de tipos", ex);
        ErrorResponse response = ErrorResponse.builder()
                .código("INTERNAL_ERROR")
                .mensaje("Error interno del servidor")
                .detalles(List.of("Error interno del servidor"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        logger.error("Error no controlado", ex);
        ErrorResponse response = ErrorResponse.builder()
                .código("INTERNAL_ERROR")
                .mensaje("Error interno del servidor")
                .detalles(List.of("Error interno del servidor"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        logger.error("Error inesperado", ex);
        ErrorResponse response = ErrorResponse.builder()
                .código("INTERNAL_ERROR")
                .mensaje("Ha ocurrido un error inesperado")
                .detalles(List.of("Error interno del servidor"))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
