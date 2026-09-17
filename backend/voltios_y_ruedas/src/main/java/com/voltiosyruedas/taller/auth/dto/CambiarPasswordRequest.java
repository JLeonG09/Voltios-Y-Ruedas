package com.voltiosyruedas.taller.auth.dto;

import com.voltiosyruedas.taller.common.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Cambio de contraseña. Se envía en el cuerpo (JSON), nunca como query params,
 * para que la contraseña no quede expuesta en URLs/logs del servidor.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CambiarPasswordRequest {

    @NotBlank(message = "La contraseña actual es obligatoria")
    private String passwordActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(max = 255, message = "La nueva contraseña no puede exceder 255 caracteres")
    @ValidPassword
    private String passwordNuevo;
}