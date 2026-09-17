package com.voltiosyruedas.taller.auth.dto;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.common.validation.ValidPassword;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Creación/edición de usuarios por ADMIN. DTO deliberadamente sin campos
 * internos (id, emailVerificado, preferencias, fechas) para evitar mass-assignment
 * al bindear la entidad directamente desde el cuerpo del request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El nombre solo puede contener letras")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El apellido solo puede contener letras")
    private String apellido;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9-]{2,}(\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}$", message = "El email debe tener un formato válido")
    @Size(max = 150, message = "El email no puede exceder 150 caracteres")
    private String email;

    @Size(min = 8, max = 255, message = "La contraseña debe tener entre 8 y 255 caracteres")
    @ValidPassword
    private String password;

    @Pattern(regexp = Usuario.PATTERN_TELEFONO, message = "El teléfono debe ser un número de Costa Rica (ej: +506 8888 8888)")
    private String telefono;

    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String direccion;

    private Boolean activo;

    @NotNull(message = "El rol es obligatorio")
    private Long rolId;
}