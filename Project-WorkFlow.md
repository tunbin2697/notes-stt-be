# **🟢 1. Initial Project Setup (NestJS + Prisma + PostgreSQL)**

### **Step 1: Create NestJS backend**

```bash
npm install -g @nestjs/cli
nest new backend
cd backend
```

- Choose `npm` or `yarn` when prompted.
- Backend folder structure:

```
backend/
 ├─ src/
 ├─ node_modules/
 ├─ package.json
 ├─ tsconfig.json
 └─ ...
```

---

### **Step 2: Install Prisma**

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

- Creates:
  - `prisma/schema.prisma` → define your database models
  - `.env` → store `DATABASE_URL`

---

### **Step 3: Set up PostgreSQL**

- Make sure Postgres is installed and running.
- Create a database (avoid template1 to fix collation issue):

```sql
CREATE DATABASE stt_notes
WITH OWNER = postgres
ENCODING = 'UTF8'
LC_COLLATE = 'C'
LC_CTYPE = 'C'
TEMPLATE = template0;
```

- Note the username/password — you’ll need it in `.env`.

---

### **Step 4: Configure `.env`**

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/stt_notes"
```

---

### **Step 5: Define initial Prisma schema**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  password String
  notes    Note[]
}

model Note {
  id        Int      @id @default(autoincrement())
  content   String
  createdAt DateTime @default(now())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
}
```

---

### **Step 6: Run migrations**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

- Creates tables in Postgres and generates Prisma client.

---

### **Step 7: Add Prisma service to NestJS**

Create `prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Create `prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- Now you can inject `PrismaService` in any module without re-importing it.

---

### **Step 8: Create feature modules**

```bash
nest g module users
nest g service users
nest g controller users

nest g module notes
nest g service notes
nest g controller notes
```

- Keep each feature in its own module for maintainability.

---

# **🟢 2. Daily Development Workflow**

Whenever you add new features or work with backend:

1. **Update Prisma schema** if you need new models or fields.
2. **Run migrations**:

```bash
npx prisma migrate dev --name descriptive_migration_name
```

3. **Regenerate Prisma client**:

```bash
npx prisma generate
```

4. **Update/Write service logic** (`users.service.ts`, `notes.service.ts`).
5. **Update/Write controller endpoints** (`users.controller.ts`, `notes.controller.ts`).
6. **Test APIs**:
   - Use Postman, Insomnia, or curl.
   - Optional: `npx prisma studio` to inspect database visually.

---

# **🟢 3. Adding New Model / Controller / Service**

Suppose you want to add `Tag` model:

### **Step 1: Update Prisma schema**

```prisma
model Tag {
  id    Int    @id @default(autoincrement())
  name  String
  notes Note[] @relation("NoteTags")
}
```

---

### **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_tag_model
npx prisma generate
```

---

### **Step 3: Create NestJS module**

```bash
nest g module tags
nest g service tags
nest g controller tags
```

---

### **Step 4: Implement service**

```ts
@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  createTag(name: string) {
    return this.prisma.tag.create({ data: { name } });
  }

  getTags() {
    return this.prisma.tag.findMany();
  }
}
```

---

### **Step 5: Implement controller**

```ts
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Post()
  create(@Body() body: { name: string }) {
    return this.tagsService.createTag(body.name);
  }

  @Get()
  findAll() {
    return this.tagsService.getTags();
  }
}
```

---

### **Step 6: Test endpoints**

- Run backend:

```bash
npm run start:dev
```

- Test POST `/tags` and GET `/tags` via Postman or browser.

---

# **💡 Best Practices / Tips**

1. **Always start from Prisma schema** for new models.
2. **Keep migrations descriptive** (`add_user_model`, `add_note_relation`).
3. **Use PrismaService globally** to avoid multiple client instances.
4. **Use `template0` for DB creation** to avoid collation issues.
5. **Use Prisma Studio** to verify data visually.
6. **Keep features modular** — one module per concept (users, notes, tags).
7. **Version control**: commit `prisma/schema.prisma` and migration files (`prisma/migrations/`) with backend code.
