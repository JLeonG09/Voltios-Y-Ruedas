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
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El nombre solo puede contener letras")
    private String nombre;

    @Schema(description = "Apellido del usuario", example = "Pérez", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede exceder 100 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El apellido solo puede contener letras")
    private String apellido;

    @Schema(description = "Teléfono del usuario", example = "123456789")
    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;

    @Schema(description = "Dirección del usuario", example = "Calle Falsa 123")
    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String direccion;
}
