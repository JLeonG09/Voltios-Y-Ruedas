package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para restablecer la contraseña con un token de recuperación")
public class PasswordResetRequest {
    @Schema(description = "Token de recuperación recibido por correo", example = "a1b2c3d4-...", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El token es obligatorio")
    private String token;

    @Schema(description = "Nueva contraseña", example = "nuevaPassword123", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String nuevaPassword;
}
