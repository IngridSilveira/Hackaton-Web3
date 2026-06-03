# ImpactLedger — Backend Spring Boot

Backend REST + WebSocket para o projeto Hackaton Web3.
Complementa `/frontend` e `/contracts` sem substituir a blockchain —
todos os dados críticos continuam no contrato `SignUp.sol`.

## Stack

| Tecnologia           | Versão | Papel                                        |
|----------------------|--------|----------------------------------------------|
| Java                 | 17     | Linguagem (Records, Pattern Matching)        |
| Spring Boot          | 3.3    | Framework principal                          |
| Spring Security      | 6.x    | Autenticação JWT stateless                   |
| Spring Data JPA      | 3.x    | Persistência ORM                             |
| Spring WebSocket     | 3.x    | STOMP sobre WebSocket                        |
| Project Reactor      | 3.x    | Streaming reativo (Flux / Mono)              |
| PostgreSQL           | 16     | Banco off-chain                              |
| Web3j                | 4.12   | Cliente Ethereum + listener de eventos       |
| jjwt                 | 0.12.6 | Geração e validação de JWT                   |
| Lombok               | latest | Redução de boilerplate                       |
| JUnit 5 + Mockito    | latest | Testes unitários                             |
| reactor-test         | 3.x    | StepVerifier para testes reativos            |

## Arquitetura

Clean Architecture com 4 camadas — dependências sempre apontam para dentro:

```
adapter/web          → application  → domain
adapter/websocket    → application  → domain
infrastructure       → application  → domain
                                    ↑
                             (nunca ao contrário)
```

```
com.impactledger/
├── domain/                        ← Puro Java, zero frameworks
│   ├── entity/         User, UserType
│   ├── valueobject/    WalletAddress, NonceMessage
│   ├── exception/      DomainException e subtipos
│   └── port/out/       UserRepositoryPort, UserEventPort,
│                       SignatureVerifierPort, TokenGeneratorPort
│
├── application/                   ← Casos de uso, DTOs, Reactor
│   ├── usecase/auth/   GenerateNonce, AuthenticateWallet
│   ├── usecase/user/   FindUser, ListOngs, StreamUserEvents
│   ├── dto/            NonceResult, AuthResult, UserResult
│   └── port/out/       UserEventStreamPort
│
├── infrastructure/                ← Spring, JPA, Web3j, JWT
│   ├── config/         Security, Cors, Web3j, WebSocket, Constantes
│   ├── persistence/    UserJpaEntity, UserJpaRepository, UserMapper,
│   │                   UserRepositoryAdapter
│   ├── blockchain/     BlockchainEventListener, SignatureVerifier
│   ├── security/       JwtService, JwtAuthFilter
│   └── websocket/      UserEventPublisher
│
└── adapter/                       ← HTTP e WebSocket — só entrada/saída
    ├── web/            AuthController, UserController, DTOs, ExceptionHandler
    └── websocket/      UserWebSocketController, UserEventBroadcaster, DTOs
```

## Pré-requisitos

- Java 17+
- Maven 3.9+
- PostgreSQL 18 rodando localmente (porta 5432)
- URL RPC Sepolia (Infura / Alchemy / QuickNode)

## Variáveis de ambiente

Crie `.env` na pasta `/backend` ou exporte no terminal:

```bash
export DB_USER=postgres
export DB_PASS=postgres
export WEB3_RPC_URL=https://sepolia.infura.io/v3/SEU_PROJECT_ID
export CONTRACT_ADDRESS=0xEnderecoDoSignUpSolDeployado
export JWT_SECRET=um-secret-com-pelo-menos-256-bits-de-entropia
```

## Como executar

```bash
# 1. Criar banco
createdb impactledger

# 2. Subir o backend
cd backend
mvn spring-boot:run
```

Servidor sobe em `http://localhost:8080`.

## Como rodar os testes

```bash
cd backend
mvn test
```

Os testes usam H2 em memória — sem precisar de PostgreSQL ou conexão com blockchain.

```
Suíte: 20 arquivos | 85 métodos @Test
─────────────────────────────────────────────
domain/           Puro JUnit 5, zero mocks
application/      Mockito + StepVerifier (Reactor)
infrastructure/   Isolados sem contexto Spring
adapter/web/      @WebMvcTest + MockMvc
adapter/websocket Mockito + CompletableFuture
```

## Endpoints REST

### Autenticação (público)

```
GET  /api/auth/nonce/{address}   → { nonce, message }
POST /api/auth/wallet            → { token, type, expiresIn }
```

**Fluxo completo no frontend:**

```typescript
// 1. Pede nonce
const { nonce, message } = await fetch(`/api/auth/nonce/${address}`).then(r => r.json())

// 2. Usuário assina com MetaMask
const signature = await signer.signMessage(message)

// 3. Autentica → recebe JWT
const { token } = await fetch('/api/auth/wallet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address, signature, message })
}).then(r => r.json())

// 4. Usa JWT nas próximas requisições
fetch('/api/users/0xAbc...', {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Usuários

```
GET /api/users/{address}          → UserResponse  (requer JWT)
GET /api/users/ongs               → UserResponse[] (público)
GET /api/users/ongs/stream        → text/event-stream (SSE, público)
```

## WebSocket (STOMP)

**Conectar:**

```typescript
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {

    // Recebe novos usuários em tempo real
    client.subscribe('/topic/users/registered', (msg) => {
      const user = JSON.parse(msg.body)
      console.log('Novo registro:', user.username, user.userType)
    })

    // Solicita lista de ONGs
    client.subscribe('/topic/users/ongs', (msg) => {
      const { ongs, total } = JSON.parse(msg.body)
      console.log(`${total} ONGs:`, ongs)
    })
    client.publish({ destination: '/app/users/ongs' })
  }
})
client.activate()
```

**Instalar dependências no frontend:**

```bash
npm install @stomp/stompjs sockjs-client
```

**Tópicos disponíveis:**

| Tópico                      | Direção            | Conteúdo                    |
|-----------------------------|--------------------|-----------------------------|
| `/topic/users/registered`   | Server → Clientes  | Novo usuário registrado     |
| `/topic/users/ongs`         | Server → Clientes  | Lista de ONGs sob demanda   |
| `/app/users/ongs`           | Cliente → Server   | Solicita lista de ONGs      |

## Fluxo de dados

```
Blockchain Sepolia
  └─► BlockchainEventListener   (Web3j RxJava Flowable)
        ├─► UserRepositoryPort  persiste off-chain no PostgreSQL
        └─► UserEventPort       publica no Sinks.Many (Reactor)
              └─► Flux<User>    stream reativo infinito
                    ├─► UserEventBroadcaster
                    │     └─► /topic/users/registered  (STOMP broadcast)
                    └─► StreamUserEventsUseCase
                          └─► disponível para outros consumers futuros
```
