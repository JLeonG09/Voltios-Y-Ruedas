package com.voltiosyruedas.taller.common.exception;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private String código;
    private String mensaje;
    private List<String> detalles;
    private LocalDateTime timestamp;
    private String path;
}