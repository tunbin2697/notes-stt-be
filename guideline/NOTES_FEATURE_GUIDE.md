# Notes Feature Documentation

## ✅ Complete Feature Implementation

The notes feature is now fully implemented with support for:

- 📝 **Regular Notes** - Free-form notes
- ✅ **Todo Lists** - Checkable task items
- 📅 **Scheduled Tasks** - Tasks with due dates
- ⏰ **Reminders** - Time-based reminders

---

## 🗄️ **Database Migration Required**

Run this command to update the database schema:

```bash
npx prisma migrate dev --name add_enhanced_notes
```

This will add:

- Enhanced `Note` model with type, status, priority fields
- Support for due dates, tags, colors, pinning, archiving
- Enums for `NoteType`, `NotePriority`, `NoteStatus`

---

## 📊 **Data Model**

### **Note Fields:**

| Field         | Type      | Description                                | Default        |
| ------------- | --------- | ------------------------------------------ | -------------- |
| `id`          | Int       | Unique identifier                          | Auto-increment |
| `title`       | String    | Note title                                 | Required       |
| `content`     | Text      | Note content                               | Required       |
| `type`        | Enum      | NOTE, TASK, TODO, REMINDER                 | NOTE           |
| `status`      | Enum      | PENDING, IN_PROGRESS, COMPLETED, CANCELLED | PENDING        |
| `priority`    | Enum      | LOW, MEDIUM, HIGH, URGENT                  | MEDIUM         |
| `dueDate`     | DateTime? | Due date for tasks/reminders               | null           |
| `completedAt` | DateTime? | When task was completed                    | null           |
| `tags`        | String[]  | Array of tags                              | []             |
| `color`       | String?   | Hex color code                             | null           |
| `isPinned`    | Boolean   | Pin to top                                 | false          |
| `isArchived`  | Boolean   | Archive note                               | false          |
| `profileId`   | Int       | Owner profile ID                           | Required       |
| `createdAt`   | DateTime  | Creation timestamp                         | Auto           |
| `updatedAt`   | DateTime  | Last update timestamp                      | Auto           |

### **Enums:**

```typescript
enum NoteType {
  NOTE      // Regular note
  TASK      // Scheduled task
  TODO      // Todo list item
  REMINDER  // Reminder
}

enum NotePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum NoteStatus {
  PENDING     // Not started
  IN_PROGRESS // Working on it
  COMPLETED   // Done
  CANCELLED   // Cancelled
}
```

---

## 🔐 **GraphQL API**

All endpoints require authentication (`Authorization: Bearer <token>`).

### **Mutations:**

#### 1. Create Note

```graphql
mutation CreateNote {
  createNote(
    input: {
      title: "Buy groceries"
      content: "Milk, eggs, bread"
      type: TODO
      priority: HIGH
      dueDate: "2025-10-20T10:00:00Z"
      tags: ["shopping", "urgent"]
      color: "#FF5733"
    }
  ) {
    id
    title
    type
    status
    priority
    dueDate
    tags
    color
  }
}
```

#### 2. Update Note

```graphql
mutation UpdateNote {
  updateNote(
    id: 1
    input: { title: "Updated title", status: IN_PROGRESS, priority: URGENT }
  ) {
    id
    title
    status
    priority
    updatedAt
  }
}
```

#### 3. Delete Note

```graphql
mutation DeleteNote {
  deleteNote(id: 1)
}
```

#### 4. Complete Task

```graphql
mutation CompleteTask {
  completeTask(id: 1) {
    id
    status
    completedAt
  }
}
```

#### 5. Uncomplete Task

```graphql
mutation UncompleteTask {
  uncompleteTask(id: 1) {
    id
    status
    completedAt
  }
}
```

#### 6. Archive Note

```graphql
mutation ArchiveNote {
  archiveNote(id: 1) {
    id
    isArchived
  }
}
```

#### 7. Unarchive Note

```graphql
mutation UnarchiveNote {
  unarchiveNote(id: 1) {
    id
    isArchived
  }
}
```

#### 8. Pin Note

```graphql
mutation PinNote {
  pinNote(id: 1) {
    id
    isPinned
  }
}
```

#### 9. Unpin Note

```graphql
mutation UnpinNote {
  unpinNote(id: 1) {
    id
    isPinned
  }
}
```

---

### **Queries:**

#### 1. Get All My Notes (with filters)

```graphql
query GetMyNotes {
  getMyNotes(
    type: TODO
    status: PENDING
    isArchived: false
    isPinned: true
    tags: ["urgent"]
  ) {
    id
    title
    content
    type
    status
    priority
    dueDate
    tags
    color
    isPinned
    isArchived
    createdAt
    updatedAt
  }
}
```

**Filters (all optional):**

- `type`: Filter by NOTE, TASK, TODO, or REMINDER
- `status`: Filter by PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `isArchived`: Show only archived (true) or non-archived (false)
- `isPinned`: Show only pinned notes
- `tags`: Filter by tags (returns notes with ANY of the provided tags)

#### 2. Get Single Note

```graphql
query GetNote {
  getNote(id: 1) {
    id
    title
    content
    type
    status
    priority
    dueDate
    completedAt
    tags
    color
    isPinned
    isArchived
  }
}
```

#### 3. Get Upcoming Notes (due within 7 days)

```graphql
query GetUpcoming {
  getUpcomingNotes {
    id
    title
    type
    priority
    dueDate
    status
  }
}
```

#### 4. Get Overdue Notes

```graphql
query GetOverdue {
  getOverdueNotes {
    id
    title
    type
    priority
    dueDate
    status
  }
}
```

#### 5. Search Notes

```graphql
query SearchNotes {
  searchNotes(query: "grocery") {
    id
    title
    content
    type
    tags
  }
}
```

---

## 🌐 **Frontend Integration Examples**

### **Fetch Example:**

```javascript
// Create a Todo
const createTodo = async (title, content, dueDate) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      query: `
        mutation CreateTodo($input: CreateNoteInput!) {
          createNote(input: $input) {
            id
            title
            type
            status
            dueDate
          }
        }
      `,
      variables: {
        input: {
          title,
          content,
          type: 'TODO',
          priority: 'MEDIUM',
          dueDate,
          tags: ['personal'],
        },
      },
    }),
  });

  const { data } = await response.json();
  return data.createNote;
};

// Get all pending todos
const getPendingTodos = async () => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      query: `
        query GetPendingTodos {
          getMyNotes(type: TODO, status: PENDING, isArchived: false) {
            id
            title
            content
            priority
            dueDate
            tags
            createdAt
          }
        }
      `,
    }),
  });

  const { data } = await response.json();
  return data.getMyNotes;
};

// Complete a task
const completeTask = async (id) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      query: `
        mutation CompleteTask($id: Int!) {
          completeTask(id: $id) {
            id
            status
            completedAt
          }
        }
      `,
      variables: { id },
    }),
  });

  const { data } = await response.json();
  return data.completeTask;
};
```

---

## 📱 **Use Cases**

### **1. Regular Note**

```graphql
mutation CreateNote {
  createNote(
    input: {
      title: "Meeting Notes"
      content: "Discussed project timeline and deliverables..."
      type: NOTE
      tags: ["work", "meeting"]
    }
  ) {
    id
  }
}
```

### **2. Todo List**

```graphql
mutation CreateTodo {
  createNote(
    input: {
      title: "Complete homework"
      content: "Math exercises 1-10"
      type: TODO
      priority: HIGH
      dueDate: "2025-10-18T23:59:00Z"
      tags: ["school"]
    }
  ) {
    id
  }
}
```

### **3. Scheduled Task**

```graphql
mutation CreateTask {
  createNote(
    input: {
      title: "Client presentation"
      content: "Prepare slides and demo"
      type: TASK
      priority: URGENT
      dueDate: "2025-10-20T14:00:00Z"
      tags: ["work", "important"]
      color: "#FF0000"
    }
  ) {
    id
  }
}
```

### **4. Reminder**

```graphql
mutation CreateReminder {
  createNote(
    input: {
      title: "Doctor appointment"
      content: "Annual checkup"
      type: REMINDER
      dueDate: "2025-10-25T09:00:00Z"
      tags: ["health"]
    }
  ) {
    id
  }
}
```

---

## 🎨 **Frontend UI Suggestions**

### **Color Coding by Priority:**

- 🟢 **LOW** - Green (#4CAF50)
- 🟡 **MEDIUM** - Yellow (#FFC107)
- 🟠 **HIGH** - Orange (#FF9800)
- 🔴 **URGENT** - Red (#F44336)

### **Icons by Type:**

- 📝 **NOTE** - Document icon
- ✅ **TODO** - Checkbox icon
- 📅 **TASK** - Calendar icon
- ⏰ **REMINDER** - Bell icon

### **Status Badges:**

- ⏳ **PENDING** - Gray
- 🔄 **IN_PROGRESS** - Blue
- ✅ **COMPLETED** - Green
- ❌ **CANCELLED** - Red

---

## ✅ **Features Included**

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Type classification (Note, Task, Todo, Reminder)
- ✅ Status tracking (Pending, In Progress, Completed, Cancelled)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Due dates for tasks/reminders
- ✅ Completion tracking with timestamps
- ✅ Tags for categorization
- ✅ Custom colors for UI
- ✅ Pin important notes to top
- ✅ Archive old notes
- ✅ Search by title/content
- ✅ Filter by type, status, tags, etc.
- ✅ Get upcoming tasks (next 7 days)
- ✅ Get overdue tasks
- ✅ Authentication & authorization (user can only access their own notes)

---

## 🔒 **Security**

- ✅ All endpoints require authentication
- ✅ Users can only access their own notes
- ✅ Profile ID verified on every operation
- ✅ Cascade delete (notes deleted when profile deleted)

---

## 🎯 **Next Steps**

1. **Run migration:**

   ```bash
   npx prisma migrate dev --name add_enhanced_notes
   ```

2. **Test in GraphQL Playground:**
   - Create notes, tasks, todos
   - Test filtering and search
   - Try pin/archive/complete operations

3. **Frontend implementation:**
   - Build note list UI
   - Add create/edit forms
   - Implement filters and search
   - Show upcoming/overdue tasks dashboard

Your notes feature is complete and ready to use! 🎉
