package com.impactledger.infrastructure.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@ConditionalOnProperty(prefix = "spring.jpa.auditing", name = "enabled", havingValue = "true", matchIfMissing = true)
@Import(JpaAuditingConfiguration.JpaAuditingRegistrar.class)
public class JpaAuditingConfiguration {

    @Configuration
    @EnableJpaAuditing
    static class JpaAuditingRegistrar {
    }
}
