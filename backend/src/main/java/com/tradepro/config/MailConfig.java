package com.tradepro.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Optional mail configuration.
 *
 * JavaMailSender is only wired when MAIL_PASSWORD is set (non-blank).
 * When not configured, OtpService logs the OTP to stdout for local development.
 * This prevents startup failures when the environment variable is missing.
 */
@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    // Default to empty string — no failure if env var is absent
    @Value("${spring.mail.password:}")
    private String password;

    @Bean
    JavaMailSender javaMailSender() {
        if (password == null || password.isBlank()) {
            log.warn("═══════════════════════════════════════════════════════════════");
            log.warn("MAIL_PASSWORD not set — email delivery is DISABLED.");
            log.warn("OTPs are printed to console AND returned in the API response.");
            log.warn("To enable email: set MAIL_PASSWORD (Gmail App Password) in Render.");
            log.warn("═══════════════════════════════════════════════════════════════");
            // Return a stub that never actually connects
            return new JavaMailSenderImpl() {
                @Override
                public void send(org.springframework.mail.SimpleMailMessage simpleMessage) {
                    log.info("[MAIL STUB] Would send to {} | Subject: {}",
                        simpleMessage.getTo(), simpleMessage.getSubject());
                }
            };
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.smtp.connectiontimeout", "3000");
        props.put("mail.smtp.timeout", "3000");
        props.put("mail.smtp.writetimeout", "3000");
        // Do NOT test connection at startup
        props.put("mail.debug", "false");

        log.info("JavaMailSender configured for {}:{}", host, port);
        return sender;
    }
}
