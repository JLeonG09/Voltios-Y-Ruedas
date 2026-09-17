package com.voltiosyruedas.taller.notificaciones.service;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envío de correos por SMTP. Si {@code app.mail.enabled} es false (o no hay
 * servidor configurado) los correos se registran por consola en modo desarrollo
 * y no se envían, evitando romper el flujo en entornos locales.
 */
@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final com.voltiosyruedas.taller.auth.repository.UsuarioRepository usuarioRepository;

    @Value("${app.mail.enabled:false}")
    private boolean habilitado;

    @Value("${app.mail.from:no-reply@voltiosyruedas.com}")
    private String remitente;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public boolean estaHabilitado() {
        return habilitado;
    }

    public void enviar(String para, String asunto, String contenidoHtml) {
        if (!habilitado) {
            log.info("[MAIL][simulado] Para={} | Asunto={}\n{}", para, asunto, contenidoHtml);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[MAIL] Envío solicitado a {} pero no hay SMTP configurado; se descarta (asunto: {})", para, asunto);
            return;
        }
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(para);
            helper.setSubject(asunto);
            helper.setText(contenidoHtml, true);
            mailSender.send(mensaje);
            log.info("Correo enviado a {}: {}", para, asunto);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo a {} (asunto: {})", para, asunto, e);
        }
    }

    /** Código de verificación de correo para un usuario recién registrado. */
    public void enviarCodigoVerificacion(String email, String codigo) {
        String cuerpo = htmlBase(
                "Verifica tu correo electrónico",
                "<p>Hola,</p>"
                        + "<p>Para completar tu registro en <strong>Voltios y Ruedas</strong> usa el siguiente código:</p>"
                        + "<p style=\"font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;\">" + codigo + "</p>"
                        + "<p>Este código expira en 30 minutos.</p>");
        enviar(email, "Voltios y Ruedas — Verifica tu correo", cuerpo);
    }

    /** Notifica al jefe de taller que un cliente agendó una cita de diagnóstico. */
    public void notificarAgendaDiagnostico(Usuario solicitante, String fechaHora) {
        usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() != null && "JEFE_TALLER".equals(u.getRol().getNombre()))
                .filter(Usuario::getActivo)
                .forEach(jefe -> {
                    String cuerpo = htmlBase(
                            "Nueva cita de diagnóstico agendada",
                            "<p>Hola <strong>" + jefe.getNombreCompleto() + "</strong>,</p>"
                                    + "<p>El cliente <strong>" + solicitante.getNombreCompleto() + "</strong> ("
                                    + solicitante.getEmail() + ") agendó una cita de diagnóstico.</p>"
                                    + "<p><strong>Fecha:</strong> " + fechaHora + "</p>");
                    enviar(jefe.getEmail(), "Nueva cita de diagnóstico", cuerpo);
                });
    }

    /** Notifica al jefe de taller y al cliente cuando un vehículo entra a trabajo. */
    public void notificarTrabajoVehiculo(com.voltiosyruedas.taller.taller.entity.OrdenTrabajo orden) {
        String etiqueta = orden.getEstado() != null ? orden.getEstado() : "";
        Usuario cliente = orden.getCliente();
        if (cliente != null) {
            String cuerpo = htmlBase(
                    "Tu vehículo está en trabajo",
                    "<p>Hola <strong>" + cliente.getNombreCompleto() + "</strong>,</p>"
                            + "<p>Te informamos que tu orden de trabajo <strong>#" + orden.getNumeroOrden()
                            + "</strong> cambió de estado a <strong>" + etiqueta + "</strong>.</p>"
                            + "<p>Te avisaremos cuando esté listo.</p>");
            enviar(cliente.getEmail(), "Voltios y Ruedas — Tu vehículo está en trabajo", cuerpo);
        }
        usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() != null && "JEFE_TALLER".equals(u.getRol().getNombre()))
                .filter(Usuario::getActivo)
                .forEach(jefe -> {
                    String cuerpo = htmlBase(
                            "Vehículo en trabajo",
                            "<p>Hola <strong>" + jefe.getNombreCompleto() + "</strong>,</p>"
                                    + "<p>La orden <strong>#" + orden.getNumeroOrden()
                                    + "</strong> ya está siendo trabajada (estado: " + etiqueta + ").</p>");
                    enviar(jefe.getEmail(), "Vehículo en trabajo — #" + orden.getNumeroOrden(), cuerpo);
                });
    }

    /** Notifica al cliente cualquier cambio de estado en su orden de trabajo. */
    public void notificarCambioEstadoOrden(com.voltiosyruedas.taller.taller.entity.OrdenTrabajo orden,
                                           String estadoAnterior, String estadoNuevo) {
        Usuario cliente = orden.getCliente();
        if (cliente == null) {
            return;
        }
        String cuerpo = htmlBase(
                "Actualización de tu orden #" + orden.getNumeroOrden(),
                "<p>Hola <strong>" + cliente.getNombreCompleto() + "</strong>,</p>"
                        + "<p>Tu orden de trabajo <strong>#" + orden.getNumeroOrden()
                        + "</strong> cambió de estado:</p>"
                        + "<p><strong>" + estadoAnterior + "</strong> → <strong>" + estadoNuevo + "</strong></p>"
                        + "<p>Puedes consultar el detalle desde tu portal de cliente.</p>");
        enviar(cliente.getEmail(), "Voltios y Ruedas — Actualización de tu orden #" + orden.getNumeroOrden(), cuerpo);
    }

    /**
     * Envía el enlace de recuperación de contraseña con su token.
     * Se usa un path param en lugar de query param para reducir la exposición
     * en logs del navegador, headers Referer e historial.
     */
    public void enviarRecuperacionPassword(String email, String token) {
        // URL-encode del token para seguridad en path params
        String tokenEncoded = java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8);
        String enlace = frontendUrl + "/reestablecer-password/" + tokenEncoded;
        String cuerpo = htmlBase(
                "Recupera tu contraseña",
                "<p>Hola,</p>"
                        + "<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en "
                        + "<strong>Voltios y Ruedas</strong>.</p>"
                        + "<p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>"
                        + "<p style=\"text-align:center;\"><a href=\"" + enlace
                        + "\" style=\"display:inline-block;background:#2563eb;color:#ffffff;"
                        + "padding:12px 24px;border-radius:8px;text-decoration:none;\">Restablecer contraseña</a></p>"
                        + "<p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>"
                        + "<p style=\"word-break:break-all;\"><code>" + enlace + "</code></p>"
                        + "<p>Este enlace expira en 1 hora. Si no lo solicitaste, ignora este correo.</p>");
        enviar(email, "Voltios y Ruedas — Recupera tu contraseña", cuerpo);
    }

    private String htmlBase(String titulo, String contenido) {
        return "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;\">"
                + "<div style=\"background:#2563eb;color:#ffffff;padding:18px 24px;border-radius:10px 10px 0 0;\">"
                + "<h2 style=\"margin:0;\">" + titulo + "</h2></div>"
                + "<div style=\"background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;\">"
                + contenido + "</div>"
                + "<p style=\"text-align:center;color:#64748b;font-size:12px;padding:12px;\">"
                + "Voltios y Ruedas — Taller automotriz</p></div>";
    }
}