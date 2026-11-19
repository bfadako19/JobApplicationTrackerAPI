# Job Application Tracker API

A RESTful API built with Node.js, Express, TypeScript, and PostgreSQL that allows users to securely manage and track their job applications.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT authentication and authorization
- Create, retrieve, update, and delete job applications
- Pagination and status filtering
- Input validation and error handling
- PostgreSQL database integration
- Automated tests with Vitest and Supertest
- Docker support

## Technologies Used

- **Node.js** – JavaScript runtime
- **Express** – REST API framework
- **TypeScript** – Static typing
- **PostgreSQL** – Relational database
- **pg** – PostgreSQL client for Node.js
- **bcrypt** – Password hashing
- **jsonwebtoken** – JWT authentication
- **Vitest** – Automated testing
- **Supertest** – HTTP endpoint testing
- **Docker** – Containerization

## Installation and Setup

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git


### 1. Clone the repository

```bash
git clone https://github.com/bfadako19/JobApplicationTrackerAPI.git
cd JobApplicationTrackerAPI
```

### 2. Install dependencies

```bash
npm install
```


### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a template.

Set the following variables:

- `DB_HOST`
- `DB_PASSWORD`
- `JWT_SECRET`

Use your own PostgreSQL credentials and a secure JWT secret. Never commit your `.env` file to GitHub.


### 4. Create the database

Create a PostgreSQL database named:

```sql
CREATE DATABASE job_application_tracker;
```

Connect to the database and create the required tables:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
```


### 5. Start the development server

```bash
npx tsx src/index.ts
```

The API runs on:

```text
http://localhost:3000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in and receive a JWT |

### Job Applications

All application endpoints require a valid JWT access token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/applications` | Retrieve the user's applications |
| POST | `/applications` | Create a new application |
| PUT | `/applications/:id` | Update an existing application |
| DELETE | `/applications/:id` | Delete an application |

### Authentication Header

Include the JWT token in the Authorization header when accessing protected endpoints:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Pagination and Filtering

The GET `/applications` endpoint supports pagination and status filtering.

Available query parameters:

- `page` – Page number
- `limit` – Number of applications per page
- `status` – Filter applications by status


## Testing

Run the automated test suite:

```bash
npm test
```

The tests use Vitest and Supertest to verify API functionality, authentication, authorization, validation, and error handling.

## Build

Compile the TypeScript project:

```bash
npm run build
```

Check TypeScript for errors without generating build files:

```bash
npx tsc --noEmit
```

## Docker

Build the Docker image:

```bash
docker build -t job-application-tracker-api .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env -e DB_HOST=host.docker.internal job-application-tracker-api
```

The API will be available at:

```text
http://localhost:3000
```

The container connects to PostgreSQL running on the host machine through `host.docker.internal`.
