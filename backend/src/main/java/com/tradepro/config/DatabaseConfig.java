package com.tradepro.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        String dbHost = System.getenv("DB_HOST");
        String pgHost = System.getenv("PGHOST");

        // 1. If DATABASE_URL is set, parse and use it
        if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
            try {
                if (databaseUrl.startsWith("jdbc:")) {
                    databaseUrl = databaseUrl.substring(5);
                }
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

                System.out.println("Connecting to database using parsed DATABASE_URL: " + dbUrl);
                return DataSourceBuilder.create()
                        .url(dbUrl)
                        .username(username)
                        .password(password)
                        .driverClassName("org.postgresql.Driver")
                        .build();
            } catch (Exception e) {
                System.err.println("Failed to parse DATABASE_URL, falling back to H2: " + e.getMessage());
            }
        }

        // 2. If DB_HOST or PGHOST is set, use custom/Railway PostgreSQL properties
        if ((dbHost != null && !dbHost.trim().isEmpty()) || (pgHost != null && !pgHost.trim().isEmpty())) {
            String host = dbHost != null ? dbHost : pgHost;
            String port = System.getenv("DB_PORT");
            if (port == null) port = System.getenv("PGPORT");
            if (port == null) port = "5432";
            
            String dbName = System.getenv("DB_NAME");
            if (dbName == null) dbName = System.getenv("PGDATABASE");
            if (dbName == null) dbName = "tradeprodb";
            
            String user = System.getenv("DB_USERNAME");
            if (user == null) user = System.getenv("PGUSER");
            if (user == null) user = "tradepro";
            
            String password = System.getenv("DB_PASSWORD");
            if (password == null) password = System.getenv("PGPASSWORD");
            if (password == null) password = "changeme";

            String dbUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;

            System.out.println("Connecting to database using host config: " + dbUrl);
            return DataSourceBuilder.create()
                    .url(dbUrl)
                    .username(user)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }

        // 3. Fallback: If no PostgreSQL configuration is present, use in-memory H2 database
        System.out.println("⚠️ No PostgreSQL configuration detected (DATABASE_URL, DB_HOST, or PGHOST are missing). Falling back to in-memory H2 database.");
        return DataSourceBuilder.create()
                .url("jdbc:h2:mem:tradeprodb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
                .username("sa")
                .password("")
                .driverClassName("org.h2.Driver")
                .build();
    }
}
