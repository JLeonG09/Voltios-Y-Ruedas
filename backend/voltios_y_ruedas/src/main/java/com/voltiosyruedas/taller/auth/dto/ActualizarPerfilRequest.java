package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Actualización del perfil del usuario autenticado")
public class ActualizarPerfilRequest {
    @Schema(description = "Nombre del usuario", example = "Juan", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El nombre solo puede contener letras")
    private String nombre;

    @Schema(description = "Apellido del usuario", example = "Pérez", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El apellido solo puede contener letras")
    private String apellido;

    @Schema(description = "Teléfono del usuario (formato Costa Rica: 8 dígitos, prefijo +506 opcional)", example = "+506 8888 8888")
    @Pattern(regexp = com.voltiosyruedas.taller.auth.entity.Usuario.PATTERN_TELEFONO, message = "El teléfono debe ser un número de Costa Rica (ej: +506 8888 8888)")
    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;

    @Schema(description = "Dirección del usuario", example = "Calle Falsa 123")
    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String direccion;
}
