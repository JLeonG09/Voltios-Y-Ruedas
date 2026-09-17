package com.voltiosyruedas.taller.auth.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements UserDetails {

    // Teléfono opcional: vacío/ausente válido; si hay valor debe ser un número CR.
    public static final String PATTERN_TELEFONO = "^(|(\\+506[ -]?)?\\d{4}[ -]?\\d{4})$";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El nombre solo puede contener letras")
    private String nombre;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[\\p{L}\\p{M}'. -]+$", message = "El apellido solo puede contener letras")
    private String apellido;

    @Column(nullable = false, unique = true, length = 150)
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9-]{2,}(\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}$", message = "El email debe tener un formato válido")
    @Size(max = 150, message = "El email no puede exceder 150 caracteres")
    private String email;

    @Column(nullable = false, length = 255)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Size(max = 255, message = "La contraseña no puede exceder 255 caracteres")
    private String password;

    @Column(length = 20)
    @Pattern(regexp = PATTERN_TELEFONO, message = "El teléfono debe ser un número de Costa Rica (ej: +506 8888 8888)")
    private String telefono;

    @Column(length = 255)
    private String direccion;

    @Column(length = 2000)
    private String preferencias;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "email_verificado", nullable = false)
    @Builder.Default
    private Boolean emailVerificado = false;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id", nullable = false)
    private Rol rol;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.getNombre()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }

    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }
}