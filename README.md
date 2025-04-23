# Data Gen Hub - Backend

Backend for a system to manage students, classes, topics, forms, and workflows related to thesis and graduation internships.

## Main Features
- User management and role-based access control (Admin, Teacher, Student, ...)
- Management of classes, students, teachers, roles
- Management of thesis topics, graduation internships
- Form management, import/export form data (Excel, Google Drive, OneDrive, ...)
- Progress tracking and submission status for student forms
- Email notification support, authentication via JWT
- Integration with cloud storage services (Google Drive, OneDrive, Firebase)
- RESTful API for frontend consumption

## System Requirements
- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 13
- Docker, Docker Compose (recommended for quick start)

## Installation & Running

### 1. Clone the source code
```bash
git clone <repo-url>
cd data-gen-hub/be/data-gen-hub-be
```

### 2. Environment configuration
- Copy the example environment file:
```bash
cp env/.env.example env/.env.development
```
- Fill in your configuration in `env/.env.development` (see comments in the example file)
- **Important:** You also need to add `drive.config.json` and `firebase.config.json` in the project root. These files contain configuration for Google Drive and Firebase integration. See sample files or documentation for details.

### 3. Install dependencies
```bash
npm install
```

### 4. Initialize the database (PostgreSQL)
- You can use Docker Compose to start PostgreSQL and pgAdmin:
```bash
docker-compose up -d postgresql pgadmin
```
- Or install PostgreSQL manually and update the connection info in your `.env` file

### 5. Run migrations (create tables)
```bash
npm run typeorm:run-migrations
```

### 6. Start the application
- Recommended: via Docker Compose
```bash
docker-compose up -d app
```
- Or manually:
```bash
npm run start:dev
```

### 7. Access the API
- Default API endpoint: `http://localhost:8080`

## Useful Scripts
- Build for production: `npm run build`
- Run tests: `npm run test`
- Lint & format: `npm run lint`, `npm run format`
- Migration: create/generate/revert using `npm run typeorm:*` scripts

## Main Modules Overview
- `auth/` - Authentication, authorization, JWT
- `users/` - User management
- `roles/`, `permissions/`, `authorization/` - Role-based access control
- `students/`, `student-v2/` - Student management, import/export lists
- `class/` - Class management
- `office/` - Form management, Office file processing
- `thesis-management/` - Thesis/project management, dashboard
- `storage/`, `drive-apis/`, `onedrive/`, `firebase.config.json` - Cloud storage integration
- `mailer/` - Email sending
- `system-configuration/` - System configuration
- `progress/` - Progress tracking

## Environment Configuration
- See `env/.env.example` for required variables (DB, email, JWT, cloud storage, ...)
- **Also required:** `drive.config.json` and `firebase.config.json` in the project root for external service integration.

## Contribution & Contact
- Contribution: please create a pull request or contact directly via email in the config file.
- Contact: ddlong07 (main author)

---

> This project uses [NestJS](https://nestjs.com/) and TypeScript.
> Please read the instructions carefully before running for the first time.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
