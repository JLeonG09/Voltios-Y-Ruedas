package com.voltiosyruedas.taller.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** SHA-256 hex del JWT de refresh; nunca el token en claro. */
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    @Column(nullable = false)
    @Builder.Default
    private Boolean revocado = false;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        if (revocado == null) {
            revocado = false;
        }
    }
}
