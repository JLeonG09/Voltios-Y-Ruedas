# Validaciones

> Esquemas de validación (Zod) del frontend en `frontend/src/utils/validation.ts`.

## Principios

- Formularios con **React Hook Form + Zod resolver** (validación en tiempo real).
- Errores mostrados en español.
- La validación del backend es la fuente de verdad (nunca confiar solo en el cliente).

## Esquemas principales

| Esquema | Descripción |
|---|---|
| `loginSchema` | email válido + contraseña ≥ 8 caracteres |
| `registerSchema` | nombre/apellido (2–50, solo letras), email, contraseña (≥8, mayúscula/minúscula/número), teléfono opcional CR, confirmar contraseña |
| `perfilSchema` | nombre/apellido, email, teléfono opcional CR, dirección |
| `usuarioSchema` (admin) | similar a registro + rol (`rolId: z.coerce.number().optional()`) + **`password` opcional** (solo se exige al crear; al editar el campo no se renderiza y si el schema lo exigiera el formulario fallaría en silencio) |
| `recuperarPasswordSchema` | email válido |
| `reestablecerPasswordSchema` | nuevo password + confirmar |

## Teléfono (Costa Rica)

`telefonoOpcional`: patrón `^(|(\+506[ -]?)?\d{4}[ -]?\d{4})$`.
- Acepta: vacío, `8888 8888`, `+506 8888 8888`, `8888-8888`.
- Rechaza símbolos o formatos que no sean CR.

## Ejemplo de uso en ConfiguracionPage

```ts
const resultado = perfilSchema.safeParse(values);
if (!resultado.success) {
  // mapear errores a setError/campos
}
```

- `guardarPerfil` valida con `safeParse` + `setError`/`clearErrors` antes de enviar al backend.
- Los errores se muestran bajo los inputs de teléfono y dirección.

## Correo

- `emailSchema`: parte local ≥2, dominio ≥2, TLD ≥2 letras (rechaza `2@m.com`).
- Reutilizado en login, registro, perfil, recuperación.

Volver a [[Home]].