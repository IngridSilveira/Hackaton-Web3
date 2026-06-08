@echo off
setlocal enabledelayedexpansion

REM Set Java Home for Java 17
set "JAVA_HOME=C:\Program Files\Amazon Corretto\jdk17.0.12_7"
set "MAVEN_HOME=C:\Users\Renato\.maven\maven-3.9.16"

REM Build the project
echo Building project with Maven...
call "%MAVEN_HOME%\bin\mvn.cmd" clean package -q -DskipTests

if !errorlevel! neq 0 (
    echo Build failed!
    exit /b 1
)

REM Find the JAR file
for %%f in (target\*.jar) do (
    set "JAR_FILE=%%f"
)

if not defined JAR_FILE (
    echo JAR file not found!
    exit /b 1
)

echo.
echo ========================================
echo Starting ImpactLedger Backend on Java 17
echo ========================================
echo.

REM Run the application
"%JAVA_HOME%\bin\java.exe" -jar "!JAR_FILE!"
