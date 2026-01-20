# Hello World REST API

A simple Java Spring Boot REST application that returns "Hello World".

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher

## How to Run

1. Navigate to the workshop1 directory:
   ```bash
   cd workshop1
   ```

2. Build the project:
   ```bash
   mvn clean package
   ```

3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

   Or run the JAR directly:
   ```bash
   java -jar target/helloworld-1.0.0.jar
   ```

4. Test the endpoint:
   ```bash
   curl http://localhost:8080/
   ```

   You should see the response: `Hello World`

## API Endpoints

- `GET /` - Returns "Hello World"

## Project Structure

```
workshop1/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── helloworld/
│   │   │               ├── HelloWorldApplication.java
│   │   │               └── HelloWorldController.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
└── README.md
```
