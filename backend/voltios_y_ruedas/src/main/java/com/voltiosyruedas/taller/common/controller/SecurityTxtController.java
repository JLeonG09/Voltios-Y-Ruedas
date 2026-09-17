package com.voltiosyruedas.taller.common.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sirve el archivo security.txt en /.well-known/security.txt
 * para divulgación responsable de vulnerabilidades.
 * RFC 9116 — https://www.rfc-editor.org/rfc/rfc9116
 */
@RestController
@RequestMapping("/.well-known")
public class SecurityTxtController {

    @GetMapping(value = "/security.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> securityTxt() {
        String body = """
                Contact: mailto:security@voltiosyruedas.com
                Expires: 2027-12-31T23:59:59.000Z
                Policy: https://voltiosyruedas.com/security-policy
                Hiring: https://voltiosyruedas.com/careers
                Acknowledgments: https://voltiosyruedas.com/security-thanks
                """;
        return ResponseEntity.ok()
                .header("Content-Type", MediaType.TEXT_PLAIN_VALUE + "; charset=utf-8")
                .body(body);
    }

    @GetMapping(value = "/security.txt", produces = "application/security.txt")
    public ResponseEntity<String> securityTxtAscii() {
        return securityTxt();
    }
}
