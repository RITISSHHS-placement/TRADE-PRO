package com.tradepro.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;
import java.net.URI;

@Configuration
@ConditionalOnProperty(name = "DATABASE_URL")
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        try {
            // Remove jdbc: prefix if it was prepended
            if (databaseUrl.startsWith("jdbc:")) {
                databaseUrl = databaseUrl.substring(5);
            }
            
            // Standardize postgresql scheme for URI parser
            String uriString = databaseUrl;
            if (uriString.startsWith("postgres:")) {
                uriString = "postgresql:" + uriString.substring(9);
            }

            URI dbUri = new URI(uriString);
            String userInfo = dbUri.getUserInfo();
            String username = "";
            String password = "";
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":");
                username = parts[0];
                password = parts[1];
            }
            
            int port = dbUri.getPort();
            String hostAndPort = dbUri.getHost();
            if (port != -1) {
                hostAndPort = hostAndPort + ":" + port;
            }
            
            String dbUrl = "jdbc:postgresql://" + hostAndPort + dbUri.getPath();

            return DataSourceBuilder.create()
                    .url(dbUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
        }
    }
}
