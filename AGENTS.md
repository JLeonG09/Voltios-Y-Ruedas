# AGENTS.md - Directrices Completas de Desarrollo para Voltios y Ruedas (Monolito)

Este documento define las reglas obligatorias de arquitectura, seguridad, estilo de código, versionado, testing y convenciones que deben seguir estrictamente todas las IAs y desarrolladores que trabajen en el sistema de gestión del taller automotriz **Voltios y Ruedas**.

---

## 1. Reglas Generales e Idioma

* **Idioma:** Todo el código (comentarios, nombres de variables no estándar, documentación, mensajes de error y respuestas de la API) debe estar estrictamente en **español**.
* **Convención de Nombres:** Utilizar rigurosamente **`camelCase`** para variables, métodos, propiedades JSON y atributos de objetos (tanto en el backend en Java como en el frontend en TypeScript). Se permite `PascalCase` para clases/interfaces y `SCREAMING_SNAKE_CASE` únicamente para constantes estáticas.
* **Arquitectura:** El proyecto es un **monolito modular**. Queda prohibido el uso de microservicios, API Gateways distribuidos o llamadas HTTP internas entre módulos. Toda la lógica corre en una sola instancia de Spring Boot conectada a una base de datos centralizada.

---

## 2. Pautas de Seguridad y Cero Vulnerabilidades (Prioridad Alta)

### 2.1 Autenticación y Autorización

* **Autenticación:** Implementar autenticación robusta basada en **JSON Web Tokens (JWT)** firmados criptográficamente.
  * **JWT_SECRET:** Mínimo **32 caracteres** (preferiblemente 64) generados aleatoriamente para HS256. Ejemplos: `openssl rand -base64 32` o `pwgen -sy 64 1`
  * Nunca usar valores por defecto en el código. Obligatoriamente desde variables de entorno.
  * **Expiración de tokens:** 24 horas máximo. Implementar refresh tokens opcionales con expiración de 7 días.
  * Invalidación de tokens: Mantener lista negra (blacklist) en Redis o base de datos para logout.

* **Contraseñas:** Almacenar utilizando obligatoriamente **BCrypt** con factor de trabajo **≥ 12**. Ejemplo en Spring Security: `new BCryptPasswordEncoder(12)`

* **Autorización:** Usar `@PreAuthorize` con roles específicos. Roles disponibles:
  * `ADMIN`: Acceso total al sistema
  * `JEFE_TALLER`: Gestión operativa de órdenes e inventario
  * `MECANICO`: Ejecución de órdenes de trabajo
  * `CLIENTE`: Acceso restringido a sus propias reservas

### 2.2 Validación de Datos

* **Backend (Java):**
  * Validar exhaustivamente todas las entradas usando Jakarta Validation (`@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Pattern`, `@Positive`, etc.)
  * Usar `@Valid` en todos los controladores en parámetros `@RequestBody`
  * Crear validadores personalizados si es necesario (p. ej., validar formato de placa de vehículo)
  * Nunca confiar en validación de cliente únicamente

* **Frontend (TypeScript):**
  * Validar formularios usando **Zod** en conjunto con **React Hook Form**
  * Implementar validaciones en tiempo real (real-time validation)
  * Mostrar errores específicos al usuario en español

### 2.3 Inyección SQL y OWASP

* Prevenir ataques de inyección SQL utilizando **exclusivamente** consultas parametrizadas:
  * Spring Data JPA repositories
  * JPQL con parámetros nombrados (`:paramName`)
  * Criteria API de JPA
  * **Prohibido:** Concatenación de strings, `@Query` con interpolación directa
  
* Cumplir con **OWASP Top 10**:
  * A01: Broken Access Control → `@PreAuthorize` en todos los endpoints
  * A03: Injection → Usar JPA, no SQL directo
  * A07: Identification and Authentication Failures → JWT seguro + BCrypt
  * A09: Security Logging → Loguear intentos de acceso fallidos

### 2.4 Manejo de Errores Seguro

* Las respuestas de error de la API **nunca** deben filtrar:
  * Stack traces
  * Información sensible del sistema operativo
  * Detalles internos de la base de datos
  * Paths de archivos del servidor

* Respuesta de error estándar (JSON):
```json
{
  "código": "VALIDATION_ERROR",
  "mensaje": "El email ya está registrado",
  "timestamp": "2026-08-10T15:30:45Z",
  "path": "/api/auth/register"
}
```

* Crear un `GlobalExceptionHandler` en Spring que maneje:
  * `MethodArgumentNotValidException` → 400 Bad Request
  * `DataIntegrityViolationException` → 409 Conflict
  * `AccessDeniedException` → 403 Forbidden
  * `EntityNotFoundException` → 404 Not Found
  * Excepciones genéricas → 500 Internal Server Error (loguear en servidor)

### 2.5 Credenciales y Configuración Sensible

* **Nunca** commitear a Git:
  * `.env` con valores reales
  * `application.properties` con credenciales
  * Claves de API, JWT_SECRET, contraseñas
  * Tokens de autenticación

* Agregar a `.gitignore`:
```
.env
.env.local
.env.*.local
*.jks
*.keystore
```

* Usar `.env.example` con valores de ejemplo (sin credenciales reales)

---

## 3. Stack Tecnológico del Monolito

### 3.1 Backend

* **Java 21** (o superior)
* **Spring Boot 4.1.0+** (Web, Data JPA, Security, Validation)
* **Spring Data JPA** para acceso a datos
* **Spring Security** para autenticación/autorización
* **Flyway** para migraciones de BD (`src/main/resources/db/migration/`)
* **JWT (JJWT 0.12.6+)** para tokens
* **Lombok** para reducir boilerplate
* **PostgreSQL 16+** como base de datos principal
* **Maven** como herramienta de compilación
* **Logback** para logging (incluido en Spring Boot)

### 3.2 Frontend

* **React 19** + **Vite** + **TypeScript**
* **Tailwind CSS 4** para estilos
* **React Hook Form** + **Zod** para formularios
* **Zustand** para estado global
* **Axios** para llamadas HTTP
* **Vite** como build tool
* **TypeScript 5+** para type safety

### 3.3 Infraestructura

* **Docker** y **Docker Compose** para PostgreSQL local
* **Git** para control de versiones
* **Maven** para compilación backend

---

## 4. Estructura de Módulos (Backend)

El código fuente en Java debe organizarse bajo el paquete base `com.voltiosyruedas.taller` dividido en los siguientes dominios:

### 4.1 com.voltiosyruedas.taller.auth
Gestión de usuarios, credenciales, control de roles y filtros de seguridad JWT.

Subdirectorios obligatorios:
* `entity/` - Entidades JPA (Usuario, Rol)
* `dto/` - DTOs para request/response (LoginRequest, RegisterRequest, JwtResponse, UsuarioResponse)
* `repository/` - Spring Data JPA repositories (UsuarioRepository, RolRepository)
* `service/` - Lógica de negocio (AuthService, UsuarioService)
* `controller/` - Endpoints REST (AuthController, UsuarioController)
* `security/` - Configuración de seguridad (SecurityConfig, JwtUtil, JwtAuthenticationFilter)

### 4.2 com.voltiosyruedas.taller.reservas
Gestión de citas, descripciones libres y categorías de servicios.

Subdirectorios obligatorios:
* `entity/` - Reserva, CategoriaServicio
* `dto/` - ReservaRequest, ReservaResponse
* `repository/` - ReservaRepository
* `service/` - ReservaService
* `controller/` - ReservaController

### 4.3 com.voltiosyruedas.taller.taller
Órdenes de trabajo, hojas de parámetros técnicos, bitácoras y control de estados de vehículos.

Estados obligatorios de vehículos:
* `RECIEN_INGRESADO` - Acababa de llegar
* `POR_INGRESAR` - En espera de ingreso
* `TRABAJANDO` - En proceso de reparación
* `TERMINADO` - Reparación completa
* `ENTREGADO` - Cliente retiró el vehículo

Subdirectorios obligatorios:
* `entity/` - Orden, EstadoVehiculo, Vehiculo, BitacoraOrden
* `dto/` - OrdenRequest, OrdenResponse, BitacoraDTO
* `repository/` - OrdenRepository
* `service/` - OrdenService
* `controller/` - OrdenController

### 4.4 com.voltiosyruedas.taller.inventario
Catálogo de repuestos, control de stock y asignación transaccional.

Subdirectorios obligatorios:
* `entity/` - Repuesto, Categoria, MovimientoInventario
* `dto/` - RepuestoRequest, RepuestoResponse
* `repository/` - RepuestoRepository
* `service/` - RepuestoService (con `@Transactional` en operaciones de stock)
* `controller/` - RepuestoController

---

## 5. Versionado de Commits (Conventional Commits)

Todos los commits **OBLIGATORIAMENTE** deben seguir el estándar **Conventional Commits**.

### 5.1 Formato

```
<tipo>(<scope>): <descripción>

<cuerpo opcional>

<footer opcional>
```

### 5.2 Tipos

* **feat:** Nueva funcionalidad
* **fix:** Corrección de bug
* **docs:** Cambios en documentación
* **style:** Cambios de formato, sin lógica (espacios, comillas, etc.)
* **refactor:** Cambios que reestructuran código sin cambiar funcionalidad
* **perf:** Mejoras de performance
* **test:** Agregar o actualizar pruebas
* **chore:** Cambios en build, dependencias, CI/CD
* **security:** Parches de seguridad, aumento de JWT_SECRET, etc.
* **ci:** Cambios en CI/CD

### 5.3 Scopes disponibles

`auth`, `reservas`, `taller`, `inventario`, `api`, `bd`, `seguridad`, `ui`, `config`, `docker`

### 5.4 Ejemplos

```
feat(auth): agregar recuperación de contraseña con email

Implementa endpoint POST /api/auth/recover-password que envía
token de recuperación al correo del usuario. Token válido por 1 hora.

Closes #42

---

fix(inventario): corregir cálculo de stock en asignación

La resta de stock no era transaccional, causando inconsistencias.
Se agregó @Transactional al servicio.

---

security(auth): aumentar JWT_SECRET a 64 caracteres

JWT_SECRET anterior era insuficiente (9 caracteres). Generado nuevo
de 64 caracteres usando openssl rand -base64 64.

BREAKING CHANGE: Tokens emitidos con SECRET anterior son inválidos

---

docs(api): documentar endpoints de órdenes de trabajo

Se agregó documentación OpenAPI/Swagger con ejemplos de request/response

---

test(taller): agregar pruebas unitarias de OrdenService

Cobertura de OrdenService pasó de 45% a 89%

---

refactor(reservas): simplificar lógica de validación de fechas

Se extrajo la validación a un validador custom de Jakarta Validation

---

chore: actualizar Spring Boot a 4.1.0
```

---

## 6. Testing y Cobertura de Pruebas

### 6.1 Estrategia General

* **Cobertura mínima obligatoria:** 70% en servicios, 50% en controladores
* **Pruebas unitarias:** Lógica de negocio sin BD
* **Pruebas integración:** Controladores, repositorios, flujos completos
* **Pruebas de seguridad:** Autenticación, autorización, JWT

### 6.2 Backend (Java - JUnit 5 + Mockito + TestContainers)

Estructura de carpetas:
```
src/test/java/com/voltiosyruedas/taller/auth/
  ├── service/
  │   └── AuthServiceTest.java
  ├── controller/
  │   └── AuthControllerTest.java
  └── security/
      └── JwtUtilTest.java
```

Ejemplo de test unitario:
```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    
    @Mock
    private UsuarioRepository usuarioRepository;
    
    @Mock
    private RolRepository rolRepository;
    
    @InjectMocks
    private AuthService authService;
    
    @Test
    void testRegistrarUsuario_exitoso() {
        RegisterRequest request = new RegisterRequest(
            "Juan", "Pérez", "juan@example.com", "password123", ...
        );
        Rol rolCliente = new Rol(4L, "CLIENTE", "Cliente del taller");
        
        when(usuarioRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(rolRepository.findById(4L)).thenReturn(Optional.of(rolCliente));
        when(usuarioRepository.save(any(Usuario.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        
        Usuario resultado = authService.registrar(request);
        
        assertNotNull(resultado);
        assertEquals("juan@example.com", resultado.getEmail());
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }
    
    @Test
    void testRegistrarUsuario_emailDuplicado() {
        RegisterRequest request = new RegisterRequest(...);
        
        when(usuarioRepository.existsByEmail(request.getEmail())).thenReturn(true);
        
        assertThrows(RuntimeException.class, () -> authService.registrar(request));
    }
}
```

Ejemplo de test de integración:
```java
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void testLogin_exitoso() throws Exception {
        LoginRequest request = new LoginRequest("admin@taller.com", "password123");
        
        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.email").value("admin@taller.com"));
    }
}
```

### 6.3 Frontend (TypeScript - Vitest + React Testing Library)

Estructura de carpetas:
```
frontend/src/__tests__/
  ├── components/
  │   └── LoginPage.test.tsx
  ├── services/
  │   └── authService.test.ts
  └── utils/
      └── validation.test.ts
```

Ejemplo de test:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/pages/LoginPage';
import * as authService from '@/services/authService';

vi.mock('@/services/authService');

describe('LoginPage', () => {
  it('debería mostrar mensaje de error con credenciales inválidas', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new Error('Credenciales inválidas')
    );
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
  });
});
```

### 6.4 Ejecución de Tests

```bash
# Backend
mvn clean test -DskipITs  # Unitarias
mvn verify                 # Unitarias + integración
mvn test jacoco:report    # Con cobertura

# Frontend
npm run test              # Vitest
npm run test:ui           # Con interfaz
npm run coverage          # Reporte de cobertura
```

---

## 7. Documentación de API (OpenAPI/Swagger)

### 7.1 Configuración Spring Boot

Agregar dependencia en `pom.xml`:
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

Configurar en `application.properties`:
```properties
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
```

### 7.2 Anotaciones en Controladores

```java
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints de login, registro y tokens")
public class AuthController {
    
    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", 
               description = "Autentica un usuario y retorna un JWT")
    @ApiResponse(
        responseCode = "200",
        description = "Login exitoso",
        content = @Content(schema = @Schema(implementation = JwtResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        // ...
    }
}
```

### 7.3 Documentación de DTOs

```java
@Data
@Builder
@Schema(description = "Respuesta de login exitoso")
public class JwtResponse {
    
    @Schema(description = "Token JWT firmado", example = "eyJhbGc...")
    private String token;
    
    @Schema(description = "ID del usuario", example = "1")
    private Long id;
    
    @Schema(description = "Email del usuario", example = "juan@example.com")
    private String email;
    
    @Schema(description = "Rol del usuario", example = "CLIENTE")
    private String rol;
}
```

Accesible en: `http://localhost:8080/swagger-ui.html`

---

## 8. Gestión de Configuración y Perfiles

### 8.1 Perfiles de Ambiente

Crear archivos de propiedades para cada ambiente:

```
src/main/resources/
  ├── application.properties          (por defecto, NO commitear credenciales)
  ├── application-dev.properties      (desarrollo local)
  ├── application-staging.properties  (pre-producción)
  └── application-prod.properties     (producción)
```

### 8.2 application.properties (valores por defecto, seguros)

```properties
spring.application.name=voltios-y-ruedas
spring.profiles.active=dev

# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/taller_db
spring.datasource.username=${POSTGRES_USER:admin}
spring.datasource.password=${POSTGRES_PASSWORD:password}
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true

# JWT
jwt.secret=${JWT_SECRET:min-32-caracteres-cambiar-en-produccion!!!}
jwt.expiration=${JWT_EXPIRATION:86400000}

# Logging
logging.level.root=INFO
logging.level.com.voltiosyruedas=DEBUG
```

### 8.3 application-prod.properties

```properties
spring.profiles.active=prod

# Base de datos
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

# JPA
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=validate

# Logging
logging.level.root=WARN
logging.level.com.voltiosyruedas=INFO

# Seguridad
server.ssl.enabled=true
server.ssl.key-store=${KEY_STORE_PATH}
server.ssl.key-store-password=${KEY_STORE_PASSWORD}
```

### 8.4 Activación de perfiles

```bash
# Desarrollo
java -jar app.jar --spring.profiles.active=dev

# Producción
java -jar app.jar --spring.profiles.active=prod -DJWT_SECRET="..." -DPOSTGRES_PASSWORD="..."
```

### 8.5 Variables de entorno (Docker/Docker Compose)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: taller_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    environment:
      SPRING_PROFILES_ACTIVE: prod
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: 86400000
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## 9. Logging y Monitoreo

### 9.1 Niveles de Log

* **DEBUG:** Información detallada para desarrolladores (métodos, parámetros)
* **INFO:** Eventos importantes (inicio de app, login exitosos)
* **WARN:** Situaciones inesperadas pero recoverable (intentos fallidos de login)
* **ERROR:** Errores que requieren atención (excepciones, fallos de BD)

### 9.2 Configuración Logback (logback-spring.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <springProperty name="LOG_LEVEL" source="logging.level.root" defaultValue="INFO"/>
  
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>
        %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
      </pattern>
    </encoder>
  </appender>

  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
      <fileNamePattern>logs/app-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
      <maxFileSize>100MB</maxFileSize>
      <maxHistory>30</maxHistory>
    </rollingPolicy>
    <encoder>
      <pattern>
        %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
      </pattern>
    </encoder>
  </appender>

  <logger name="com.voltiosyruedas" level="DEBUG"/>
  <logger name="org.springframework.security" level="DEBUG"/>
  
  <root level="${LOG_LEVEL}">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
  </root>
</configuration>
```

### 9.3 Logging en Código

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    public String login(LoginRequest request) {
        logger.info("Intento de login para email: {}", request.getEmail());
        
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(), 
                    request.getPassword()
                )
            );
            logger.info("Login exitoso para usuario: {}", request.getEmail());
            // ... resto del código
        } catch (BadCredentialsException e) {
            logger.warn("Intento de login fallido para email: {}", request.getEmail());
            throw new RuntimeException("Credenciales inválidas");
        }
    }
}
```

### 9.4 Eventos de Auditoría (Seguridad Crítica)

Loguear obligatoriamente:
* Cambios de contraseña
* Acceso a endpoints de ADMIN
* Modificaciones de órdenes de trabajo
* Cambios de stock de inventario
* Intentos de acceso no autorizado (403, 401)

---

## 10. Paginación, Límites y Rate Limiting

### 10.1 Paginación

Usar `Pageable` de Spring Data:

```java
@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
public ResponseEntity<Page<Usuario>> listar(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "id") String sort
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(sort));
    return ResponseEntity.ok(usuarioService.listar(pageable));
}
```

* **Tamaño máximo por página:** 100 registros
* **Tamaño por defecto:** 20 registros
* **Parámetros query:** `?page=0&size=20&sort=id,desc`

### 10.2 Rate Limiting para Auth

Implementar rate limiting en `/api/auth/login`:

Dependencia:
```xml
<dependency>
    <groupId>io.github.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.10.0</version>
</dependency>
```

Implementación:
```java
@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    
    private final Bucket bucket = Bucket4j.builder()
        .addLimit(Limit.of(5, Refill.intervally(5, Duration.ofMinutes(1))))
        .build();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
            HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        if (request.getRequestURI().equals("/api/auth/login")) {
            if (!bucket.tryConsume(1)) {
                response.setStatus(429); // Too Many Requests
                response.getWriter().write("Demasiados intentos. Intente más tarde.");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### 10.3 Límites de Payload

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof AbstractHttpMessageConverter) {
                // Máximo 10MB por request
                ((AbstractHttpMessageConverter<?>) converter).setDefaultContentType(
                    MediaType.APPLICATION_JSON
                );
            }
        }
    }
}
```

---

## 11. Respuesta Estándar de API

### 11.1 Estructura de Respuestas de Éxito

```json
{
  "datos": { /* contenido del recurso */ },
  "mensaje": "Operación completada exitosamente",
  "timestamp": "2026-08-10T15:30:45Z"
}
```

### 11.2 Estructura de Respuestas de Error

```json
{
  "código": "CODIGO_ERROR",
  "mensaje": "Descripción del error en español",
  "detalles": [
    "Campo 'email' no es válido",
    "Campo 'contraseña' debe tener mínimo 8 caracteres"
  ],
  "timestamp": "2026-08-10T15:30:45Z",
  "path": "/api/auth/register"
}
```

### 11.3 Códigos HTTP Estándar

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK - Operación exitosa | GET, PUT exitosos |
| 201 | Created - Recurso creado | POST exitoso |
| 204 | No Content - Sin contenido | DELETE exitoso |
| 400 | Bad Request - Datos inválidos | Validación fallida |
| 401 | Unauthorized - No autenticado | Token expirado/faltante |
| 403 | Forbidden - No autorizado | Sin permisos de rol |
| 404 | Not Found - Recurso inexistente | ID no existe |
| 409 | Conflict - Conflicto de datos | Email duplicado |
| 429 | Too Many Requests - Rate limit | Demasiados intentos |
| 500 | Internal Server Error | Error del servidor |

### 11.4 Clase Helper para Respuestas

```java
@Data
@Builder
public class ApiResponse<T> {
    private T datos;
    private String mensaje;
    private LocalDateTime timestamp;
    private String path;
    
    public static <T> ApiResponse<T> ok(T datos, String mensaje) {
        return ApiResponse.<T>builder()
            .datos(datos)
            .mensaje(mensaje)
            .timestamp(LocalDateTime.now())
            .build();
    }
}

@Data
@Builder
public class ErrorResponse {
    private String código;
    private String mensaje;
    private List<String> detalles;
    private LocalDateTime timestamp;
    private String path;
}
```

---

## 12. Estrategia de Branching (Git Flow Simplificado)

### 12.1 Ramas Principales

* **main:** Código en producción. Solo merge con PRs aprobados.
* **develop:** Rama de integración. Base para feature branches.
* **feature/\*:** Nuevas funcionalidades (`feature/auth-recovery-password`)
* **bugfix/\*:** Correcciones de bugs (`bugfix/jwt-expiration`)
* **hotfix/\*:** Parches urgentes para producción (`hotfix/security-patch`)

### 12.2 Flujo de Trabajo

```bash
# 1. Crear rama de feature desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-funcionalidad

# 2. Hacer commits con Conventional Commits
git commit -m "feat(auth): agregar recuperación de contraseña"
git commit -m "test(auth): agregar pruebas de recuperación"

# 3. Push y crear Pull Request
git push origin feature/nombre-funcionalidad
# Crear PR en GitHub con descripción clara

# 4. Una vez aprobado y CI pasa
git checkout develop
git merge --no-ff feature/nombre-funcionalidad
git push origin develop

# 5. Para release a producción
git checkout main
git merge --no-ff develop
git tag v1.0.0
git push origin main --tags
```

### 12.3 Protección de Ramas

Configurar en GitHub:

* **main:**
  - Requerir PR para merge
  - Requerir 2 aprobaciones
  - Requerir que CI pase
  - Descartar historial después de merge

* **develop:**
  - Requerir PR para merge
  - Requerir 1 aprobación
  - Requerir que CI pase

---

## 13. Versionado Semántico (SemVer)

Formato: `MAJOR.MINOR.PATCH` (ej: `1.2.3`)

* **MAJOR:** Cambios incompatibles (breaking changes)
* **MINOR:** Nuevas funcionalidades (backward compatible)
* **PATCH:** Correcciones de bugs

### 13.1 Ejemplos

```
v0.1.0 - Versión inicial del proyecto
v1.0.0 - Release de producción
v1.1.0 - Nueva funcionalidad: recuperación de contraseña
v1.1.1 - Parche de seguridad en JWT_SECRET
v2.0.0 - Breaking change: cambio en estructura de API
```

### 13.2 Gestión de Versiones en Maven

```xml
<!-- pom.xml -->
<version>1.2.3</version>
```

```bash
mvn versions:set -DnewVersion=1.2.4
mvn clean deploy
git tag v1.2.4
```

---

## 14. Migraciones de Base de Datos (Flyway)

### 14.1 Convención de Nomenclatura

```
src/main/resources/db/migration/
  ├── V1__crear_tabla_usuarios.sql
  ├── V2__crear_tabla_roles.sql
  ├── V3__agregar_columna_telefono_usuarios.sql
  └── V4__crear_indice_email_usuarios.sql
```

Formato: `V{numero}__{descripcion}.sql`

### 14.2 Reglas de Migraciones

* **Nunca** modificar una migración ya ejecutada. Crear una nueva.
* **Nunca** usar `DROP TABLE` sin backup previo.
* Usar transacciones `BEGIN; ... COMMIT;` en migraciones críticas.
* Agregar índices en columnas de búsqueda frecuente.
* Documentar cambios en comentarios SQL.

### 14.3 Ejemplo de Migración

```sql
-- V5__crear_tabla_ordenes_trabajo.sql
BEGIN;

CREATE TABLE ordenes_trabajo (
    id BIGSERIAL PRIMARY KEY,
    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    vehiculo_id BIGINT NOT NULL REFERENCES vehiculos(id),
    mecanico_id BIGINT REFERENCES usuarios(id),
    estado VARCHAR(50) NOT NULL DEFAULT 'RECIEN_INGRESADO',
    descripcion_problema TEXT,
    descripcion_solucion TEXT,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por BIGINT REFERENCES usuarios(id),
    modificado_por BIGINT REFERENCES usuarios(id)
);

CREATE INDEX idx_ordenes_vehiculo ON ordenes_trabajo(vehiculo_id);
CREATE INDEX idx_ordenes_mecanico ON ordenes_trabajo(mecanico_id);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes_trabajo(fecha_ingreso);

COMMENT ON TABLE ordenes_trabajo IS 'Órdenes de trabajo del taller';
COMMENT ON COLUMN ordenes_trabajo.estado IS 'Estados: RECIEN_INGRESADO, POR_INGRESAR, TRABAJANDO, TERMINADO, ENTREGADO';

COMMIT;
```

### 14.4 Rollback de Migraciones

Flyway NO tiene rollback automático. Estrategia:

1. Crear migración "inversa" que deshaga los cambios
2. Ejemplo: `V6__deshacer_cambios_v5.sql`
3. **Nunca** borrar migraciones versionadas

```sql
-- V6__deshacer_tabla_ordenes_trabajo.sql
BEGIN;

DROP INDEX IF EXISTS idx_ordenes_fecha;
DROP INDEX IF EXISTS idx_ordenes_estado;
DROP INDEX IF EXISTS idx_ordenes_mecanico;
DROP INDEX IF EXISTS idx_ordenes_vehiculo;
DROP TABLE IF EXISTS ordenes_trabajo;

COMMIT;
```

---

## 15. Seguridad Avanzada

### 15.1 JWT - Expiración y Refresh Tokens

```java
@Component
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}") // 24 horas por defecto
    private Long expiration;
    
    @Value("${jwt.refresh.expiration:604800000}") // 7 días
    private Long refreshExpiration;
    
    public String generateToken(UserDetails userDetails) {
        // Token de acceso: 24 horas
        return createToken(new HashMap<>(), userDetails.getUsername(), expiration);
    }
    
    public String generateRefreshToken(UserDetails userDetails) {
        // Refresh token: 7 días
        return createToken(new HashMap<>(), userDetails.getUsername(), refreshExpiration);
    }
    
    public String refreshAccessToken(String refreshToken) {
        // Validar refresh token
        if (!validateToken(refreshToken)) {
            throw new InvalidTokenException("Refresh token expirado o inválido");
        }
        
        String username = extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return generateToken(userDetails);
    }
}
```

### 15.2 Token Blacklist (Logout)

```java
@Service
public class TokenBlacklistService {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    public void blacklistToken(String token, long expirationTime) {
        // Agregar token a blacklist en Redis con expiración
        redisTemplate.opsForValue().set(
            "blacklist:" + token, 
            "true", 
            Duration.ofMillis(expirationTime)
        );
    }
    
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("blacklist:" + token)
        );
    }
}

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private TokenBlacklistService tokenBlacklistService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
            HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String jwt = extractToken(request);
        if (jwt != null && tokenBlacklistService.isBlacklisted(jwt)) {
            response.setStatus(401);
            response.getWriter().write("Token ha sido revocado");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### 15.3 HTTPS y Headers de Seguridad

```java
@Configuration
public class SecurityHeadersConfig implements WebMvcConfigurer {
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, 
                    HttpServletResponse response, Object handler) {
                
                // HSTS - Forzar HTTPS
                response.addHeader("Strict-Transport-Security", 
                    "max-age=31536000; includeSubDomains");
                
                // Prevenir clickjacking
                response.addHeader("X-Frame-Options", "DENY");
                
                // Prevenir MIME sniffing
                response.addHeader("X-Content-Type-Options", "nosniff");
                
                // XSS Protection
                response.addHeader("X-XSS-Protection", "1; mode=block");
                
                // CSP
                response.addHeader("Content-Security-Policy", 
                    "default-src 'self'; script-src 'self' 'unsafe-inline'");
                
                return true;
            }
        });
    }
}
```

---

## 16. Checklist Pre-Deploy a Producción

Antes de hacer deploy a producción, verificar:

- [ ] Todos los tests pasan (JUnit + React Testing Library)
- [ ] Cobertura de código >= 70% en servicios
- [ ] Sin credenciales hardcodeadas (grep -r "password", "secret", "key")
- [ ] JWT_SECRET >= 32 caracteres, generado aleatoriamente
- [ ] HTTPS/TLS configurado
- [ ] Headers de seguridad agregados
- [ ] Rate limiting en endpoints sensibles
- [ ] Logging configurado (sin stack traces en error responses)
- [ ] Backups de BD configurados
- [ ] Migraciones Flyway validadas
- [ ] Variables de entorno en servidor (no en .env)
- [ ] Documentación Swagger/OpenAPI actualizada
- [ ] Revisar logs de última semana de desarrollo
- [ ] PR aprobada por al menos 2 personas
- [ ] CI/CD pipeline verde (build + tests + security scan)
- [ ] Documento de cambios (CHANGELOG) actualizado

---

## 17. Recursos Útiles

* **Conventional Commits:** https://www.conventionalcommits.org/
* **Spring Security:** https://spring.io/projects/spring-security
* **Spring Data JPA:** https://spring.io/projects/spring-data-jpa
* **JWT:** https://jwt.io/
* **OWASP:** https://owasp.org/Top10/
* **Flyway:** https://flywaydb.org/
* **React Testing Library:** https://testing-library.com/
* **Zod Validation:** https://zod.dev/
* **Docker Compose:** https://docs.docker.com/compose/

---

**Última actualización:** 2026-08-10
**Versión:** 2.0 (Mejorada)
**Autor:** Equipo de Desarrollo - Voltios y Ruedas
