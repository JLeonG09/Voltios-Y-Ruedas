package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para iniciar la recuperación de contraseña")
public class RecuperarPasswordRequest {
    @Schema(description = "Email del usuario registrado", example = "usuario@ejemplo.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9-]{2,}(\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}$", message = "El email debe tener un formato válido")
    private String email;
}
