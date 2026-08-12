package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud de renovación de token de acceso mediante refresh token")
public class RefreshTokenRequest {
    @Schema(description = "Refresh token emitido en el login", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "El refresh token es obligatorio")
    private String refreshToken;
}
