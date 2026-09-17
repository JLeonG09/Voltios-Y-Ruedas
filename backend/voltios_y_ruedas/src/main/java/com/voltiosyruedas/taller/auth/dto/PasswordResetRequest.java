package com.voltiosyruedas.taller.auth.dto;

import com.voltiosyruedas.taller.common.validation.ValidPassword;
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

    @Schema(description = "Nueva contraseña (8+ chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo)", example = "NuevaPassword1!", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(max = 255, message = "La contraseña no puede exceder 255 caracteres")
    @ValidPassword
    private String nuevaPassword;
}
