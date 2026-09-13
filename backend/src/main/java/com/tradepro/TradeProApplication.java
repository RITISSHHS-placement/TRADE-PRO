package com.tradepro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.boot.autoconfigure.mail.MailSenderValidatorAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
    // Exclude mail auto-config — we configure JavaMailSender ourselves (optional bean)
    MailSenderAutoConfiguration.class,
    MailSenderValidatorAutoConfiguration.class,
    // Exclude Redis auto-config — we create our own LettuceConnectionFactory in RedisConfig
    RedisAutoConfiguration.class,
    RedisRepositoriesAutoConfiguration.class,
})
@EnableScheduling
public class TradeProApplication {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        SpringApplication app = new SpringApplication(TradeProApplication.class);
        // Disable banner to shave a few ms
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        app.run(args);
        System.out.println(
            "✅ TradePro backend started in "
            + (System.currentTimeMillis() - start) + " ms"
        );
    }
}
