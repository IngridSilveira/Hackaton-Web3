# 📋 Guia Completo de Setup - ImpactLedger Web3

## Visão Geral da Arquitetura

O projeto é uma aplicação Web3 fullstack com três componentes principais:

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPACTLEDGER HACKATON                    │
├─────────────────────────────────────────────────────────────┤
│ Frontend (React/Vite)  │  Backend (Spring Boot)  │  Blockchain (Hardhat/Solidity) │
│   TypeScript 6.0       │   Java 17 + Spring 3.3  │   Solidity 0.8.28              │
│   Node.js 18+          │   PostgreSQL 16         │   Ethers.js 6.16               │
│   Port: 5173 (dev)     │   Port: 8080            │   Sepolia/Polygon Mumbai       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 DEPENDÊNCIAS DO PROJETO

### 1️⃣ BACKEND (Spring Boot)

#### **Requisitos de Sistema**
| Componente | Versão | Obrigatório | Descrição |
|-----------|--------|-----------|-----------|
| **Java Development Kit (JDK)** | 17 (mínimo) | ✅ SIM | Linguagem principal do backend |
| **Maven** | 3.9+ | ✅ SIM | Gerenciador de build e dependências |
| **PostgreSQL** | 16 | ✅ SIM | Banco de dados relacional off-chain |
| **Git** | Qualquer | Recomendado | Versionamento |

#### **Dependências Maven (do `pom.xml`)**

| Dependência | Versão | Escopo | Função |
|------------|--------|--------|--------|
| **spring-boot-starter-parent** | 3.3.0 | compile | Framework base - controla versões de todas as dependências Spring |
| **spring-boot-starter-web** | 3.3.0 | compile | REST API HTTP com Tomcat embarcado |
| **spring-boot-starter-websocket** | 3.3.0 | compile | WebSocket + STOMP para comunicação em tempo real |
| **spring-boot-starter-security** | 3.3.0 | compile | Autenticação e autorização (JWT stateless) |
| **spring-boot-starter-data-jpa** | 3.3.0 | compile | ORM Hibernate para persistência |
| **spring-boot-starter-validation** | 3.3.0 | compile | Validação Bean Validation (javax.validation) |
| **reactor-core** | 3.x (transitiva) | compile | Reactive Streams (Flux/Mono para WebSocket) |
| **postgresql** | Última (em runtime) | runtime | Driver JDBC para conectar ao PostgreSQL |
| **jjwt-api** | 0.12.6 | compile | JWT (geração de tokens) |
| **jjwt-impl** | 0.12.6 | runtime | Implementação JWT (Elliptic Curve) |
| **jjwt-jackson** | 0.12.6 | runtime | Serialização JSON para JWT |
| **org.web3j:core** | 4.12.2 | compile | Cliente Ethereum - listener de eventos, assinatura de mensagens |
| **lombok** | latest | provided | Reduce boilerplate (@Data, @Builder, @Slf4j) |
| **mockito-core** | latest | test | Mock objects para testes unitários |
| **assertj-core** | latest | test | Assertions fluentes (fluent assertions) |
| **h2** | latest | test | Banco em memória para testes (não precisa PostgreSQL nos testes) |
| **reactor-test** | 3.x | test | StepVerifier para testar streams reativos |
| **spring-boot-starter-test** | 3.3.0 | test | JUnit 5, TestNG, Spring Test Framework |
| **spring-security-test** | latest | test | Testes com contexto de segurança |

**⚠️ Observações Importantes:**
- **Spring Boot 3.3.0** traz mudanças significativas (Java 17+ obrigatório, jakarta.* em vez de javax.*)
- **Reactor Core** é transitivo mas necessário para streaming reativo via WebSocket
- **PostgreSQL driver é runtime** - Maven baixa na compilação mas só usa na execução
- **H2 é test-only** - alternativa em memória para testes locais sem PostgreSQL

---

### 2️⃣ FRONTEND (React + Vite)

#### **Requisitos de Sistema**
| Componente | Versão | Obrigatório | Descrição |
|-----------|--------|-----------|-----------|
| **Node.js** | 18 LTS ou 20+ | ✅ SIM | Runtime JavaScript e npm/pnpm |
| **npm ou pnpm** | Qualquer | ✅ SIM | Gerenciador de pacotes |
| **Git** | Qualquer | Recomendado | Versionamento |

#### **Dependências npm (do `package.json`)**

**Dependências Principais (runtime):**

| Pacote | Versão | Função |
|--------|--------|--------|
| **react** | 19.2.6 | Framework UI principal |
| **react-dom** | 19.2.6 | Renderização React no DOM |
| **react-router-dom** | 6.30.3 | Roteamento entre páginas (home, donate, signup) |
| **vite** | 8.0.12 | Bundler/dev server ultra-rápido (ESM nativo) |
| **typescript** | ~6.0.2 | Tipagem estática para JavaScript |
| **ethers** | 6.16.0 | Cliente Ethereum - conectar ao MetaMask, assinar transações |
| **zustand** | 5.0.13 | State management (mais simples que Redux) |
| **tailwindcss** | 4.3.0 | Utilitários CSS (estilos inline) |
| **@tailwindcss/vite** | 4.3.0 | Plugin Vite para Tailwind (HMR + purge) |
| **@base-ui/react** | 1.5.0 | Componentes headless sem estilos |
| **lucide-react** | 1.16.0 | Ícones SVG |
| **react-hot-toast** | 2.6.0 | Notificações/toasts não-bloqueantes |
| **@fontsource-variable/inter** | 5.2.8 | Fonte Inter (variable fonts) |
| **clsx** | 2.1.1 | Merging condicional de classes CSS |
| **class-variance-authority** | 0.7.1 | Type-safe CSS classes variants |
| **tailwind-merge** | 3.6.0 | Merge Tailwind classes sem conflitos |
| **shadcn** | 4.8.0 | Copy-paste UI components |
| **tw-animate-css** | 1.4.0 | Animações CSS com Tailwind |

**Dependências de Desenvolvimento:**

| Pacote | Versão | Função |
|--------|--------|--------|
| **@vitejs/plugin-react** | 6.0.1 | Plugin Vite para Fast Refresh do React |
| **@types/react** | 19.2.14 | Tipos TypeScript para React |
| **@types/react-dom** | 19.2.3 | Tipos TypeScript para react-dom |
| **@types/node** | 24.12.3 | Tipos para Node.js (path, fs, etc) |
| **typescript-eslint** | 8.59.2 | ESLint com suporte TypeScript |
| **eslint** | 10.3.0 | Linter (code style checker) |
| **eslint-plugin-react-hooks** | 7.1.1 | Rules para hooks do React |
| **eslint-plugin-react-refresh** | 0.5.2 | Detecção de Fast Refresh issues |
| **globals** | 17.6.0 | Globais de browser/node para ESLint |

**⚠️ Observações Importantes:**
- **Ethers.js 6.x** mudou muito da API (Provider.getSigner() removido, usar BrowserProvider)
- **Vite 8.0.12** é bem mais rápido que Webpack (ESM nativo em dev)
- **TypeScript 6.0** traz melhorias de performance (pode quebrar tipos em edge cases)
- **Tailwind 4.3** é moderno mas pode ter incompatibilidades com plugins antigos
- **React 19** é muito novo (beta no início de 2024) - possível instabilidade

---

### 3️⃣ SMART CONTRACTS (Hardhat + Solidity)

#### **Requisitos de Sistema**
| Componente | Versão | Obrigatório | Descrição |
|-----------|--------|-----------|-----------|
| **Node.js** | 18 LTS ou 20+ | ✅ SIM | Runtime para Hardhat |
| **npm ou pnpm** | Qualquer | ✅ SIM | Gerenciador de pacotes |
| **Git** | Qualquer | Recomendado | Versionamento |
| **Ganache-cli (opcional)** | 7.x | Opcional | Blockchain local em memória para testes |

#### **Dependências npm (do `package.json`)**

**Dependências Principais:**

| Pacote | Versão | Função |
|--------|--------|--------|
| **hardhat** | 3.5.1 | Framework Solidity - compilação, testes, deploy |
| **@nomicfoundation/hardhat-ethers** | 4.0.8 | Integração Hardhat + ethers.js |
| **@nomicfoundation/hardhat-toolbox-mocha-ethers** | 3.0.4 | Preset com Mocha + ethers para testes |
| **@nomicfoundation/hardhat-ignition** | 3.1.2 | Sistema de deployment (alternativa ao deploy.ts) |
| **ethers** | 6.16.0 | Cliente Ethereum (deploy, calls, events) |
| **@openzeppelin/contracts** | 5.6.1 | Biblioteca padrão Ethereum (ERC20, Ownable, AccessControl) |
| **forge-std** | v1.9.4 | Utilitários Foundry para Hardhat (via git) |

**Dependências de Desenvolvimento:**

| Pacote | Versão | Função |
|--------|--------|--------|
| **typescript** | ~6.0.3 | Tipagem estática (deploy.ts, teste.ts) |
| **@types/node** | 22.19.19 | Tipos para Node.js |
| **@types/mocha** | 10.0.10 | Tipos para Mocha test runner |
| **@types/chai** | 5.2.3 | Tipos para Chai assertions |
| **@types/chai-as-promised** | 8.0.2 | Tipos para chai.use(chaiAsPromised) |
| **mocha** | 11.7.5 | Test runner (padrão Hardhat) |
| **chai** | 6.2.2 | Assertions (expect/should) |

**Configuração Solidity:**

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| **Solidity Version** | 0.8.28 | Versão do compilador (em hardhat.config.ts) |
| **EVM Target** | Ethereum (default) | Alvo de compilação |

**⚠️ Observações Importantes:**
- **Solidity 0.8.28** tem overflow/underflow checks nativos (não precisa SafeMath)
- **OpenZeppelin 5.6.1** é versão major nova - imports mudaram (AccessControl é mais compacto)
- **Hardhat 3.5.1** requer Node 18+
- **Deploy.ts** usa `network.create()` (método mais novo) em vez de `ethers.getSigner()`

---

## 🔗 DEPENDÊNCIAS EXTERNAS & SERVIÇOS

### **Redes Blockchain Testnet**

| Rede | URL RPC | Faucet | Usar Para |
|------|---------|--------|-----------|
| **Sepolia** | https://sepolia.infura.io/v3/{PROJECT_ID} | [sepolia.dev](https://www.sepolia.dev) | Testes Ethereum (padrão) |
| **Polygon Mumbai** | https://rpc-mumbai.maticvigil.com | [faucet.polygon.technology](https://faucet.polygon.technology) | Testes Polygon (alternativa) |

**⚠️ Necessário um account em:**
- **Infura** (para RPC URL) ou **Alchemy**, **QuickNode**, etc
- **MetaMask** (para assinatura de transações)

---

## 🗄️ BANCO DE DADOS

### **PostgreSQL 16**

#### **Conexão**
```bash
# Padrão em application.yml
postgresql://localhost:5432/impactledger

# Credenciais padrão
username: postgres
password: postgres  # ⚠️ MUDE EM PRODUÇÃO
```

#### **Schema (Auto-criado por Hibernate)**
- Hibernate usa `ddl-auto: update` → cria tabelas automaticamente a partir de `@Entity`
- Não há SQL schema fixo - é gerado dinamicamente
- Requer permissões CREATE TABLE no banco

#### **Dados Críticos Armazenados**
- Usuários registrados (wallet address, nonce, JWT issued_at)
- Histórico off-chain (eventos WebSocket, notificações)
- **Dados críticos ficam no blockchain** (SignUp.sol contrato)

---

## 🔑 VARIÁVEIS DE AMBIENTE

### **Backend (criar `.env` na pasta `/backend`)**

```bash
# ========== BANCO DE DADOS ==========
DB_USER=postgres
DB_PASS=postgres  # ⚠️ MUDAR EM PRODUÇÃO
DB_HOST=localhost
DB_PORT=5432
DB_NAME=impactledger

# ========== BLOCKCHAIN ==========
WEB3_RPC_URL=https://sepolia.infura.io/v3/SEU_PROJECT_ID_AQUI
CONTRACT_ADDRESS=0xEnderecoDoSignUpSolDeployado
# Exemplo: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b

# ========== JWT ==========
JWT_SECRET=um-secret-aleatorio-com-pelo-menos-256-bits-de-entropia-MUDE-ISSO
# Gerar: openssl rand -base64 32

# ========== CORS ==========
CORS_ORIGINS=http://localhost:5173

# ========== LOGGING ==========
LOG_LEVEL=DEBUG  # ou INFO em produção
```

**⚠️ Problemas Conhecidos:**
1. `application.properties` tem credenciais **hardcoded** (segurança precária)
2. Arquivo `application.yml` sobrescreve `.properties` se ambos existirem
3. Variáveis de ambiente têm default inseguro

---

## 🚀 PASSO A PASSO: SETUP COMPLETO DO ZERO

### **Fase 1: Verificar Pré-requisitos**

```bash
# 1. Verificar Java
java -version
# Esperado: openjdk 17.0.x LTS

# 2. Verificar Maven
mvn -version
# Esperado: Apache Maven 3.9+

# 3. Verificar Node.js
node --version
npm --version
# Esperado: node v18+ / npm v9+

# 4. Verificar PostgreSQL
psql --version
# Esperado: psql 16+
```

---

### **Fase 2: Setup PostgreSQL**

```bash
# 2.1. Iniciar serviço PostgreSQL (Windows)
# Já deve estar rodando se instalou com pgAdmin

# 2.2. Conectar como admin
psql -U postgres

# 2.3. Criar banco dentro do psql
CREATE DATABASE impactledger;
\q  # sair

# 2.4. Verificar
psql -U postgres -d impactledger -c "SELECT 1;"
```

---

### **Fase 3: Smart Contracts (Hardhat)**

```bash
cd /contracts

# 3.1. Instalar dependências
npm install

# 3.2. Compilar contratos Solidity
npx hardhat compile

# 3.3. Rodar testes (usa hardhat node em memory)
npm test

# 3.4. Deploy em Sepolia (futuro)
# npx hardhat run scripts/deploy.ts --network sepolia
# Esperar resposta com CONTRACT_ADDRESS
```

**Output esperado:**
```
✅ Campaign.sol compiled
✅ Donate.sol compiled  
✅ SignUp.sol compiled
✅ All 3 tests passed
```

**⚠️ Após deploy, copiar `CONTRACT_ADDRESS` para `.env`**

---

### **Fase 4: Backend (Spring Boot)**

```bash
cd /backend

# 4.1. Criar arquivo .env (se não existir)
touch .env
# Adicionar variáveis (ver seção anterior)

# 4.2. Resolver dependências Maven
mvn clean dependency:resolve

# 4.3. Compilar
mvn clean compile

# 4.4. Rodar testes
mvn test

# 4.5. Build JAR
mvn clean package

# 4.6. Iniciar servidor
mvn spring-boot:run
# Ou: java -jar target/backend-0.0.1-SNAPSHOT.jar

# Esperado: "Started ImpactLedgerApplication in X.XXX seconds"
```

**Verificar saúde:**
```bash
curl http://localhost:8080/actuator/health
# Resposta: {"status":"UP"}
```

---

### **Fase 5: Frontend (React + Vite)**

```bash
cd /frontend

# 5.1. Instalar dependências
npm install

# 5.2. Dev server com HMR
npm run dev

# Abrir: http://localhost:5173

# 5.3. Build otimizado
npm run build

# 5.4. Preview da build
npm run preview
```

**⚠️ Frontend precisa que:**
- Backend rode em `http://localhost:8080`
- MetaMask esteja instalado
- Rede Sepolia esteja adicionada ao MetaMask

---

## ⚠️ PROBLEMAS CONHECIDOS & COMPATIBILIDADE

### **1. Conflito de Versões TypeScript**

```
Problema: Contracts usa ~6.0.3, Frontend usa ~6.0.2
Risco: npm pode instalar versões incompatíveis
Solução: Usar npm workspaces ou lockfile exato (package-lock.json)
```

### **2. React 19 é Beta**

```
Problema: React 19.2.6 é versão "latest" mas pode ter bugs
Risco: Hooks podem não funcionar como esperado em edge cases
Solução: Reportar bugs no GitHub React / usar 18.3.x se instabilidade
```

### **3. Java 17 vs Spring Boot 3.3**

```
Problema: Spring Boot 3.3 REQUER Java 17+
Risco: Não funciona em Java 11/8
Solução: Verificar JAVA_HOME está apontando para JDK 17+
```

### **4. Tailwind CSS 4.x Breaking Changes**

```
Problema: Tailwind 4.3 mudou sintaxe de plugins e temas
Risco: Configurações Tailwind 3.x quebram
Solução: Atualizar tailwind.config.js ou downgrade para 3.4.x
```

### **5. PostgreSQL Connection Timeout**

```
Problema: Backend não conecta ao PostgreSQL
Causa Comum: PostgreSQL não está rodando / porta 5432 bloqueada
Solução: 
  - Windows: Services → PostgreSQL → Start
  - Linux: sudo systemctl start postgresql
  - Verificar: netstat -an | grep 5432
```

### **6. Hardhat Network Incompatibilidade**

```
Problema: ethers.getSigner() não existe em Hardhat 3.x
Causa: API mudou em ethers 6.x
Solução: Usar network.create() ou BrowserProvider (vide deploy.ts)
```

### **7. Credenciais Hardcoded**

```
Problema: application.properties tem DB password visível
Risco: Segurança crítica - exposto no git
Solução: 
  - Deletar application.properties
  - Usar APENAS environment variables
  - Adicionar ao .gitignore: .env, application.properties
```

### **8. Falta de Docker**

```
Problema: Não há Docker Compose para setup rápido
Causa: Projeto hackathon, sem containerização
Impacto: Setup manual mais complexo
Workaround: (ver seção Docker no final)
```

---

## 🐳 SETUP ALTERNATIVO COM DOCKER (Recomendado)

Se quiser evitar instalações locais:

```bash
# Criar docker-compose.yml na raiz
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: impactledger
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Iniciar
docker-compose up -d postgres

# Depois rodar backend/frontend/contracts como antes
```

---

## 📊 RESUMO DE PORTAS & ENDPOINTS

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| **Frontend (Vite)** | 5173 | http://localhost:5173 | Dev server React |
| **Backend (Spring)** | 8080 | http://localhost:8080 | REST API + WebSocket |
| **Backend - Actuator** | 8080 | http://localhost:8080/actuator | Health checks |
| **PostgreSQL** | 5432 | jdbc:postgresql://localhost:5432/impactledger | Banco dados |
| **Hardhat Node** | 8545 | http://127.0.0.1:8545 | RPC Local (opcional) |
| **MetaMask** | - | Browser Extension | Carteira Web3 |

---

## ✅ CHECKLIST FINAL DE VALIDAÇÃO

```bash
# 1. Verificar Java
java -version | grep "17"  # ✅ Deve mostrar 17

# 2. Verificar Maven
mvn -version | grep "3.9"  # ✅ Deve mostrar 3.9+

# 3. Verificar Node
node --version  # ✅ Deve mostrar v18+

# 4. Conectar banco
psql -U postgres -d impactledger -c "SELECT NOW();"  # ✅ OK

# 5. Build backend
cd backend && mvn clean package -DskipTests  # ✅ BUILD SUCCESS

# 6. Build contracts
cd contracts && npm install && npx hardhat compile  # ✅ Compiled 3 contracts

# 7. Build frontend
cd frontend && npm install && npm run build  # ✅ dist/ criado

# 8. Iniciar em 3 terminais simultâneos:
# Terminal 1: cd backend && mvn spring-boot:run
# Terminal 2: cd frontend && npm run dev  
# Terminal 3: cd contracts && npm test
```

---

## 📚 REFERÊNCIAS

- [Spring Boot 3.3 Docs](https://spring.io/projects/spring-boot)
- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [React 19 Beta Docs](https://react.dev/)
- [Solidity 0.8.28 Docs](https://docs.soliditylang.org/en/v0.8.28/)

