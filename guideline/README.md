# 📚 Notes STT Backend - Documentation# 📚 Notes STT Backend - Documentation# 📚 DPL Notes Backend - Documentation Hub

Complete guide for developing and deploying the Notes STT backend.

---Quick reference guide for the Notes STT backend API and deployment.**Complete Guide to DPL Notes Backend API**

## 📖 Available Guides

| Guide | Description |------

|-------|-------------|

| **[API Guide](./API_GUIDE.md)** | Complete API documentation with GraphQL queries, mutations, and authentication |

| **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** | Production deployment with Docker, webhooks, and automation |

## 📖 Available Guides## 📖 Documentation Files

---

## 🚀 Quick Start

| Guide | Description |This folder contains **9 comprehensive guides** that cover everything you need:

### Initial Project Setup

|-------|-------------|

If starting from scratch:

| [API Guide](./API_GUIDE.md) | Complete API documentation with GraphQL queries, mutations, and authentication |### **API & Features**

```bash

# Install NestJS CLI| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | Production deployment with Docker, webhooks, and automation |

npm install -g @nestjs/cli

| Document                                                     | Description                                                            | Target Audience              |

# Create new NestJS project

nest new backend---| ------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------- |

cd backend

| 📘 [**API Complete Guide**](./API_COMPLETE_GUIDE.md)         | **All-in-one reference** - Auth, Notes, Pagination, Validation, Errors | **Everyone - Start here!**   |

# Install Prisma

npm install prisma --save-dev## 🚀 Quick Start| 📙 [**Password Management**](./PASSWORD_MANAGEMENT_GUIDE.md) | Change/reset password flows with OTP                                   | Developers implementing auth |

npm install @prisma/client

npx prisma init

```

### Development### **Docker & Deployment**

### Development Environment

````bash

# Install dependencies```bash| Document                                                      | Description                                      | Target Audience         |

npm install

# Install dependencies| ------------------------------------------------------------- | ------------------------------------------------ | ----------------------- |

# Generate Prisma Client

npx prisma generatenpm install| ⭐ [**Production Setup Review**](./PRODUCTION_SETUP_REVIEW.md) | **Complete review & recommendations - START HERE!** | **Everyone Deploying**  |



# Run database migrations| 🪝 [**Webhook Deployment**](./WEBHOOK_DEPLOYMENT.md)          | Automated deployment via GitHub webhooks         | **DevOps & Deployment** |

npx prisma migrate dev

# Generate Prisma Client| 🐳 [**Docker Deployment**](./DOCKER_DEPLOYMENT.md)            | Manual Docker deployment guide                   | **DevOps & Deployment** |

# Start development server

npm run start:devnpx prisma generate| 📋 [**Production Checklist**](./PRODUCTION_CHECKLIST.md)      | Pre-deployment checklist & troubleshooting       | **DevOps & Deployment** |

````

| 🚀 [**Docker Setup Summary**](./DOCKER_SETUP_SUMMARY.md) | Quick reference for Docker commands | **DevOps & Deployment** |

### Production Deployment

# Run database migrations| 🔐 [**GitHub Secrets Setup**](./GITHUB_SECRETS_SETUP.md) | Configure CI/CD secrets (optional) | **DevOps & CI/CD** |

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete production setup.

npx prisma migrate dev

---

---

## 🔧 Daily Development Workflow

# Start development server

### 1. Working with Database Models

npm run start:dev## 🚀 Quick Start

When adding new models or updating existing ones:

````

```bash

# 1. Edit prisma/schema.prisma### **New to the API?**

# Add your new model or modify existing

### Production Deployment

# 2. Create and apply migration

npx prisma migrate dev --name descriptive_migration_name**Just read this:** [**API Complete Guide**](./API_COMPLETE_GUIDE.md)



# 3. Regenerate Prisma ClientSee [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete production setup including:

npx prisma generate

- Docker configurationIt includes:

# 4. Verify in Prisma Studio (optional)

npx prisma studio- GitHub webhook automation

````

- Nginx setup- ✅ Authentication (register, login, refresh)

**Example: Adding a new model**

- SSL certificates- ✅ Notes CRUD (create, read, update, delete)

````prisma

// prisma/schema.prisma- Troubleshooting- ✅ Pagination (offset & cursor-based)

model Tag {

  id    Int      @id @default(autoincrement())- ✅ Validation rules (constraints & errors)

  name  String   @unique

  notes Note[]---- ✅ Error handling & best practices

}

```- ✅ Quick reference & troubleshooting



### 2. Creating New Features## 🔑 Key Features



Generate module, service, and resolver/controller:### **Need Password Reset?**



```bash- **GraphQL API** with Apollo Server

# For GraphQL (current setup)

nest g module tags- **Authentication** via JWT tokensRead: [**Password Management Guide**](./PASSWORD_MANAGEMENT_GUIDE.md)

nest g service tags

nest g resolver tags- **Database** PostgreSQL with Prisma ORM



# For REST API (if needed)- **Docker** ready for production### **Deploying to Production?**

nest g controller tags

```- **Automated Deployment** via GitHub webhooks



### 3. Implementing Services**Start here:** ⭐ [**Production Setup Review**](./PRODUCTION_SETUP_REVIEW.md) - Complete analysis!



Example service implementation:---



```typescript**Then choose your deployment method:**

// src/tags/tags.service.ts

import { Injectable } from '@nestjs/common';## 📝 API Overview- 🪝 [**Webhook Deployment**](./WEBHOOK_DEPLOYMENT.md) - **Recommended** (no GitHub Actions needed)

import { PrismaService } from '../prisma/prisma.service';

- 🐳 [**Docker Deployment**](./DOCKER_DEPLOYMENT.md) - Manual deployment guide

@Injectable()

export class TagsService {The API provides:- � [**Production Checklist**](./PRODUCTION_CHECKLIST.md) - Final checklist

  constructor(private prisma: PrismaService) {}

- User authentication (register, login, refresh tokens)

  async createTag(name: string) {

    return this.prisma.tag.create({- Notes management (CRUD operations)---

      data: { name },

    });- Advanced filtering and search

  }

- Password management (change, reset)## 🎯 Quick Reference

  async getAllTags() {

    return this.prisma.tag.findMany();

  }

Full API documentation: [API_GUIDE.md](./API_GUIDE.md)### **Common Tasks**

  async getTagById(id: number) {

    return this.prisma.tag.findUnique({

      where: { id },

      include: { notes: true },---| I want to...          | Section in Guide                                                             |

    });

  }| --------------------- | ---------------------------------------------------------------------------- |

}

```## 🐳 Deployment Overview| Set up authentication | [Authentication](./API_COMPLETE_GUIDE.md#-authentication)                    |



### 4. Implementing Resolvers (GraphQL)| Create/update notes   | [Notes Feature](./API_COMPLETE_GUIDE.md#-notes-feature)                      |



Example resolver:Production deployment uses:| Add pagination        | [Pagination & Performance](./API_COMPLETE_GUIDE.md#-pagination--performance) |



```typescript- **Docker**: Multi-stage builds (~150MB images)| Fix validation errors | [Validation Rules](./API_COMPLETE_GUIDE.md#-validation-rules)                |

// src/tags/tags.resolver.ts

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';- **docker-compose**: PostgreSQL + Backend orchestration| Handle errors         | [Error Handling](./API_COMPLETE_GUIDE.md#️-error-handling)                   |

import { TagsService } from './tags.service';

- **Webhooks**: Automated deployment on push to `production` branch| Optimize performance  | [Best Practices](./API_COMPLETE_GUIDE.md#-best-practices)                    |

@Resolver()

export class TagsResolver {- **Nginx**: Reverse proxy and static file serving| Reset password        | [Password Management Guide](./PASSWORD_MANAGEMENT_GUIDE.md)                  |

  constructor(private tagsService: TagsService) {}

| Deploy with Docker    | [Production Checklist](./PRODUCTION_CHECKLIST.md)                            |

  @Query(() => [Tag])

  async tags() {Full deployment guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)| Docker commands       | [Docker Setup Summary](./DOCKER_SETUP_SUMMARY.md)                            |

    return this.tagsService.getAllTags();

  }| Setup CI/CD secrets   | [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md)                            |



  @Mutation(() => Tag)---

  async createTag(@Args('name') name: string) {

    return this.tagsService.createTag(name);---

  }

}## 🔧 Environment Variables

````

## 📊 Feature Matrix

### 5. Testing Your Changes

Required environment variables (create `.env` file):

````bash

# Run development server| Feature              | Supported | Where to Find                                                                      |

npm run start:dev

```env| -------------------- | --------- | ---------------------------------------------------------------------------------- |

# Test API

# - GraphQL Playground: http://localhost:3000/graphql# Database| User Registration    | ✅        | [API Guide - Auth](./API_COMPLETE_GUIDE.md#registration)                           |

# - Or use Postman/Insomnia

POSTGRES_PASSWORD=your_password| JWT Authentication   | ✅        | [API Guide - Auth](./API_COMPLETE_GUIDE.md#login)                                  |

# Run tests

npm run testDATABASE_URL=postgresql://postgres:password@localhost:5432/stt_notes| Refresh Tokens       | ✅        | [API Guide - Auth](./API_COMPLETE_GUIDE.md#refresh-token)                          |



# Run linter| CRUD Notes           | ✅        | [API Guide - Notes](./API_COMPLETE_GUIDE.md#-notes-feature)                        |

npm run lint

```# JWT| Archive/Pin/Complete | ✅        | [API Guide - Quick Actions](./API_COMPLETE_GUIDE.md#quick-actions)                 |



---JWT_SECRET=your_secret_key| Search & Filter      | ✅        | [API Guide - Notes](./API_COMPLETE_GUIDE.md#get-my-notes-with-pagination--filters) |



## 🗂️ Project Structure| Pagination (Offset)  | ✅        | [API Guide - Pagination](./API_COMPLETE_GUIDE.md#1-offset-based-numbered-pages)    |



```# Server| Pagination (Cursor)  | ✅        | [API Guide - Pagination](./API_COMPLETE_GUIDE.md#2-cursor-based-infinite-scroll)   |

backend/

├── src/NODE_ENV=development| Input Validation     | ✅        | [API Guide - Validation](./API_COMPLETE_GUIDE.md#-validation-rules)                |

│   ├── auth/              # Authentication (JWT, guards, strategies)

│   │   ├── auth.module.tsPORT=3000| Password Change      | ✅        | [Password Guide](./PASSWORD_MANAGEMENT_GUIDE.md#change-password)                   |

│   │   ├── auth.service.ts

│   │   ├── auth.resolver.tsCORS_ORIGIN=http://localhost:5173| Password Reset       | ✅        | [Password Guide](./PASSWORD_MANAGEMENT_GUIDE.md#forgot-password)                   |

│   │   ├── jwt.strategy.ts

│   │   └── dto/```| Upcoming/Overdue     | ✅        | [API Guide - Special Queries](./API_COMPLETE_GUIDE.md#special-queries)             |

│   ├── notes/             # Notes CRUD operations

│   │   ├── notes.module.ts

│   │   ├── notes.service.ts

│   │   ├── notes.resolver.tsSee `.env.example` for complete template.---

│   │   ├── dto/

│   │   └── entities/

│   ├── user/              # User management

│   │   ├── users.module.ts---## 💡 Documentation Philosophy

│   │   ├── users.service.ts

│   │   ├── users.resolver.ts

│   │   └── entities/

│   ├── security/          # Guards and security## 📁 Project Structure**We consolidated from 8 files to 5 comprehensive guides!**

│   │   └── guards/

│   ├── config/            # Configuration

│   ├── enums/             # Shared enums

│   ├── app.module.ts      # Root module```✅ **Before:** Scattered info across 8+ separate files

│   └── main.ts            # Application entry point

├── prisma/backend/✅ **Now:** 5 focused guides organized by purpose

│   ├── schema.prisma      # Database schema

│   ├── migrations/        # Migration history├── src/

│   ├── prisma.service.ts  # Prisma service

│   └── prisma.module.ts   # Prisma module│   ├── auth/          # Authentication (JWT, guards)**Structure:**

├── Dockerfile             # Production Docker image

├── docker-compose.yml     # Container orchestration│   ├── notes/         # Notes CRUD operations

├── deploy.sh              # Automated deployment script

├── .env                   # Environment variables (DO NOT COMMIT)│   ├── user/          # User management- 📘 **API Guides** (2 files) - For developers building with the API

├── .env.example           # Environment template

└── package.json│   └── main.ts        # Application entry point- 🐳 **Docker Guides** (3 files) - For DevOps & production deployment

````

├── prisma/

---

│ ├── schema.prisma # Database schema**Benefits:**

## 🛠️ Common Commands

│ └── migrations/ # Database migrations

### Development

├── Dockerfile # Production Docker image- 🎯 Single source of truth per topic

````bash

npm run start              # Start application├── docker-compose.yml # Container orchestration- 🔍 Easy to search (Ctrl+F)

npm run start:dev          # Start with hot-reload

npm run start:debug        # Start with debugger└── deploy.sh          # Automated deployment script- 📱 Better mobile reading

npm run build              # Build for production

npm run lint               # Run ESLint```- 🚀 Faster onboarding

npm run test               # Run unit tests

npm run test:e2e           # Run end-to-end tests- 🐳 Production-ready deployment

````

---

### Database (Prisma)

---

````bash

npx prisma migrate dev              # Create and apply migration (dev)## 🛠️ Common Commands

npx prisma migrate deploy           # Apply migrations (production)

npx prisma migrate reset            # Reset database (⚠️ deletes all data)## 🆘 Common Issues

npx prisma generate                 # Generate Prisma Client

npx prisma studio                   # Open database GUI### Development

npx prisma db seed                  # Run seed script

npx prisma db push                  # Push schema without migration (dev only)```bash| Problem                     | Solution                                                                                    |

````

npm run start:dev # Start with hot-reload| --------------------------- | ------------------------------------------------------------------------------------------- |

### Docker

npm run build # Build for production| Can't authenticate? | Check [Using Access Tokens](./API_COMPLETE_GUIDE.md#using-access-tokens) |

```````bash

docker-compose up -d --build        # Build and start containersnpm run lint           # Run ESLint| Pagination not working?     | Verify you access `.nodes` array - [Pagination](./API_COMPLETE_GUIDE.md#response-structure) |

docker-compose down                 # Stop containers

docker-compose down -v              # Stop and remove volumes (⚠️ deletes data)```| Validation errors?          | Review [Validation Rules](./API_COMPLETE_GUIDE.md#-validation-rules)                        |

docker-compose logs -f backend      # View backend logs

docker-compose logs -f postgres     # View database logs| Password reset not working? | Check console for OTP - [Password Guide](./PASSWORD_MANAGEMENT_GUIDE.md)                    |

docker-compose ps                   # Check container status

docker-compose exec backend sh      # Access backend container shell### Database| Docker build failing?       | See [Troubleshooting](./DOCKER_DEPLOYMENT.md#-troubleshooting)                              |

docker-compose exec postgres psql -U postgres -d stt_notes  # Access database

``````bash| Container won't start?      | Check [Common Issues](./PRODUCTION_CHECKLIST.md#-common-issues--solutions)                  |



### NestJS CLInpx prisma migrate dev           # Create and apply migration



```bashnpx prisma migrate deploy        # Apply migrations (production)---

# Generate module

nest g module feature-namenpx prisma studio                # Open database GUI



# Generate servicenpx prisma generate              # Generate Prisma Client## 🔧 Tools & Resources

nest g service feature-name

```````

# Generate controller (REST)

nest g controller feature-name### **Development**

# Generate resolver (GraphQL)### Docker

nest g resolver feature-name

```bash- **GraphQL Playground:** `http://localhost:3000/graphql`

# Generate guard

nest g guard feature-namedocker-compose up -d --build # Build and start containers- **Schema:** Auto-generated in `schema.gql`

# Generate interceptordocker-compose down # Stop containers- **Architecture:** See `Architecture_pattern_guide.md` in root folder

nest g interceptor feature-name

```docker-compose logs -f backend   # View backend logs- **Project Workflow:** See `Project-WorkFlow.md` in root folder

---docker-compose ps # Check container status

## 🔑 Environment Variables```### **Deployment**

Create `.env` file in project root:

### Development---- **Docker:** Multi-stage production build

````env- **docker-compose:** Backend + PostgreSQL orchestration

# Database

POSTGRES_PASSWORD=postgres## 📞 Support- **CI/CD:** GitHub Actions workflow (`.github/workflows/`)

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stt_notes

- **Environment:** `.env.example` template

# JWT

JWT_SECRET=your-development-secret-keyFor detailed information, see:



# Server- **API Issues**: [API_GUIDE.md](./API_GUIDE.md)---

NODE_ENV=development

PORT=3000- **Deployment Issues**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) → Troubleshooting section

CORS_ORIGIN=http://localhost:5173

```**Last Updated:** October 16, 2025



### Production---



```env**Happy Coding! 🚀**

# Database

POSTGRES_PASSWORD=strong_random_password_here**Happy coding! 🚀**

DATABASE_URL=postgresql://postgres:password@postgres:5432/stt_notes

# JWT (Generate: openssl rand -base64 32)
JWT_SECRET=your_super_secret_production_key_here

# Server
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://notes-stt.baokhangdev.click
````

See `.env.example` for complete template.

---

## 💡 Best Practices

### Database

1. **Always start from Prisma schema** when adding new models
2. **Use descriptive migration names**: `add_user_profile`, `add_note_tags`
3. **Never edit migration files** after they're created
4. **Use `template0` for PostgreSQL database** to avoid collation issues:

```sql
CREATE DATABASE stt_notes
WITH OWNER = postgres
ENCODING = 'UTF8'
LC_COLLATE = 'C'
LC_CTYPE = 'C'
TEMPLATE = template0;
```

### Code Organization

1. **Keep features modular** - one module per concept (users, notes, tags)
2. **Use PrismaService globally** via `@Global()` decorator
3. **Follow NestJS conventions** for file naming and structure
4. **Use DTOs for validation** with `class-validator`
5. **Use entities for GraphQL types** with `@nestjs/graphql`

### Version Control

1. **Commit Prisma schema** (`prisma/schema.prisma`)
2. **Commit migration files** (`prisma/migrations/`)
3. **Never commit `.env`** (use `.env.example` as template)
4. **Use `.gitignore`** for generated files and secrets

### Testing

1. **Use Prisma Studio** to verify data visually
2. **Test APIs with GraphQL Playground** at `http://localhost:3000/graphql`
3. **Write unit tests** for services
4. **Write e2e tests** for critical flows

---

## 📝 API Overview

The API provides:

- **Authentication**: Register, login, refresh tokens, JWT-based
- **User Management**: Profile updates, password management
- **Notes CRUD**: Create, read, update, delete notes
- **Advanced Features**: Filtering, pagination, search, tagging
- **Password Reset**: OTP-based password reset flow

Full API documentation: **[API_GUIDE.md](./API_GUIDE.md)**

---

## 🐳 Deployment Overview

Production deployment uses:

- **Docker**: Multi-stage builds (~150MB final image)
- **docker-compose**: PostgreSQL + Backend orchestration
- **Webhooks**: Automated deployment on push to `production` branch
- **Nginx**: Reverse proxy and static file serving
- **Let's Encrypt**: Free SSL certificates

Full deployment guide: **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## 🆘 Troubleshooting

### Common Issues

**Database connection failed:**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check DATABASE_URL in .env
# For Docker: use 'postgres' as hostname, not 'localhost'
DATABASE_URL=postgresql://postgres:password@postgres:5432/stt_notes
```

**Prisma Client not found:**

```bash
# Regenerate Prisma Client
npx prisma generate
```

**Port already in use:**

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

**Migration failed:**

```bash
# Check current migration status
npx prisma migrate status

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Force deploy migration
npx prisma migrate deploy
```

For detailed troubleshooting, see:

- **API Issues**: [API_GUIDE.md](./API_GUIDE.md)
- **Deployment Issues**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) → Troubleshooting section

---

## 📞 Support & Resources

- **NestJS Docs**: https://docs.nestjs.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **GraphQL**: https://graphql.org/learn/
- **Docker**: https://docs.docker.com/

---

**Happy coding! 🚀**
