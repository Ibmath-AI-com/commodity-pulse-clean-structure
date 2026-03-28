PROJECT: Commodity Pulse

Architecture:
- Clean Architecture (Entities / Application / Interface Adapters / Infrastructure / DI)
- Next.js App Router
- TypeScript
- DI container: ioctopus

Auth:
- Migrating from Firebase Auth to PostgreSQL
- Tables:
  - app_user
  - auth_session
- Password hashing: argon2
- Session tokens stored hashed in DB
- Cookies:
  cp_session
  cp_refresh

Infrastructure:
- AWS EC2
- PostgreSQL
- n8n workflows
- Ollama + Docling on AI server
- Firestore still used temporarily for prediction history

Important modules:
- di/container.ts
- di/modules/auth.module.ts
- di/types.ts

Repositories:
- PostgresUserRepository
- PostgresSessionRepository

Services:
- Argon2PasswordHasher
- CryptoTokenService
- NextSessionService

Current work:
- Removing FirebaseAuthServerService
- Removing SessionApiService
- Implementing Postgres authentication
- Migrating Firestore user profiles to PostgreSQL

Known tasks remaining:
- migration script Firestore → Postgres
- dashboard auth refactor
- prediction history migration


------------


Load this project context before answering:

PROJECT: Commodity Pulse

Architecture:
- Clean Architecture (Entities / Application / Interface Adapters / Infrastructure / DI)
- Next.js App Router
- TypeScript
- DI container: ioctopus

Auth:
- Migrating from Firebase Auth to PostgreSQL
- Tables:
  - app_user
  - auth_session
- Password hashing: argon2
- Session tokens stored hashed in DB
- Cookies:
  cp_session
  cp_refresh

Infrastructure:
- AWS EC2
- PostgreSQL
- n8n workflows
- Ollama + Docling on AI server
- Firestore still used temporarily for prediction history

Important modules:
- di/container.ts
- di/modules/auth.module.ts
- di/types.ts

Repositories:
- PostgresUserRepository
- PostgresSessionRepository

Services:
- Argon2PasswordHasher
- CryptoTokenService
- NextSessionService

Current work:
- Removing FirebaseAuthServerService
- Removing SessionApiService
- Implementing Postgres authentication
- Migrating Firestore user profiles to PostgreSQL

Known tasks remaining:
- migration script Firestore → Postgres
- dashboard auth refactor
- prediction history migration

We are continuing implementation of the Commodity Pulse system.
Use Clean Architecture conventions already established.
Do not introduce Firebase for authentication. Auth is PostgreSQL.

Now continue with:
[paste the code or problem]

------

di/types.ts
di/modules/auth.module.ts
src/application/use-cases/auth/login.use-case.ts
src/interface-adapters/controllers/auth/login.controller.ts