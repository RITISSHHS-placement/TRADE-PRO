package com.tradepro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async + Retry configuration for production-grade auth:
 *
 *  - @EnableAsync   → lets OTP email send happen in background thread
 *                     so HTTP response returns instantly (non-blocking)
 *  - @EnableRetry   → lets @Retryable on sendOtpEmail auto-retry on SMTP failure
 *  - otpEmailExecutor → dedicated thread pool so OTP threads never block
 *                        main request threads
 *
 * Thread pool sizing:
 *   core=2, max=10, queue=200 — handles bursts of ~200 simultaneous OTP
 *   sends without dropping any, then queues extras up to 200.
 */
@Configuration
@EnableAsync
@EnableRetry
public class AsyncConfig {

    @Bean(name = "otpEmailExecutor")
    public Executor otpEmailExecutor() {
        ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
        exec.setCorePoolSize(2);
        exec.setMaxPoolSize(10);
        exec.setQueueCapacity(200);
        exec.setThreadNamePrefix("otp-email-");
        exec.setWaitForTasksToCompleteOnShutdown(true);
        exec.setAwaitTerminationSeconds(15);
        exec.initialize();
        return exec;
    }
}
