# Person A — Foundation, Auth & Users (Eclipse + PostgreSQL)

Java 17 · Spring Boot 3.3 · Spring Security (JWT) · Hibernate/JPA · PostgreSQL · Maven

This is Person A's slice: project foundation, JWT security, error handling,
registration/login, and the user module. Everyone else builds on top of it,
so it must run and be merged first.

===================================================================
SETUP IN ECLIPSE (one time)
===================================================================
1) INSTALL: JDK 17+, "Eclipse IDE for Enterprise Java and Web Developers",
   PostgreSQL + pgAdmin, and Lombok (step 2).

2) INSTALL LOMBOK INTO ECLIPSE (or you get hundreds of fake red errors):
   - Download lombok.jar from https://projectlombok.org/download
   - Run it:  java -jar lombok.jar
   - Click "Specify location", choose your Eclipse install folder,
     click Install/Update, Quit, then RESTART Eclipse.
   - Verify in Help > About Eclipse (Lombok is listed).

3) DATABASE: in pgAdmin create a database named  testforge , open its Query
   Tool, paste db/TestForge_schema.sql, run it. Confirm 9 tables appear.

4) IMPORT: Eclipse > File > Import > Maven > "Existing Maven Projects" >
   select this folder (the one with pom.xml) > Finish. Wait for Maven to
   download dependencies. If red, right-click project > Maven > Update Project.

5) CONFIGURE src/main/resources/application.properties:
   - spring.datasource.password = your postgres password
   - app.jwt.secret            = a long random string (>=32 chars)
   (email settings aren't needed for Person A.)

6) RUN: right-click project > Run As > Spring Boot App
   (or Run As > Java Application > TestForgeApplication).
   Console: "Started TestForgeApplication" -> API live on port 8080.
   Make an admin after registering once:
     UPDATE users SET role='ADMIN' WHERE email='<your email>';

If there's no "Spring Boot App" option: install "Spring Tools 4" from the
Eclipse Marketplace, or just use Run As > Java Application.

===================================================================
WHAT THIS SLICE CONTAINS
===================================================================
config/     SecurityConfig (JWT filter chain, BCrypt), CorsConfig
security/   JwtService, JwtAuthenticationFilter, CustomUserDetailsService
common/     enums: Role, EmailStatus, WeaknessStatus
exception/  BadRequestException, ResourceNotFoundException, GlobalExceptionHandler
auth/       register + login (controller, service, DTOs)
user/       User entity, repository, service, controller, DTO, mapper

Endpoints:
  POST /api/auth/register   (public)
  POST /api/auth/login      (public)
  GET  /api/users           (ADMIN)
  GET  /api/users/{id}      (ADMIN)
All non-auth endpoints need header: Authorization: Bearer <JWT>
