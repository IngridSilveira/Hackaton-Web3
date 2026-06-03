package com.impactledger;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ImpactLedgerApplicationTests {

    @Test
    void contextLoads() {
        // Garante que todo o contexto Spring sobe sem erros
    }
}
