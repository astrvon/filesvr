# File Server API

This is a RESTful API for a file server built with Bun, ElysiaJS, Drizzle ORM, PostgreSQL, and Jose.

## Features

- User management (register, login, modify)
- File management (upload, download, delete)
- Storage usage tracking
- JWT-based authentication
- Role-based access control (admin vs regular user)

> [!NOTE]
> This REST API only works on Linux-based operating system due to file storage functions only works on this specific OS.

## Prerequisites

- Bun (latest version)
- PostgreSQL
- Linux-based operating system

## Setup

1. Clone the repository:

```bash
git clone https://gitlab.bahanatcw.com/abel.dustin/filesvr.git
```

2. Change directory:

```bash
cd filesvr
```

3. Install all dependencies:

```bash
bun install
```

4. Generate and migrate the database:

> [!WARNING]
> Don't forget to set up the environment first before running this command. This command won't generate anything if the databases are not yet defined on the environment.

```bash
bun run db:generate
bun run db:push
```

5. Run application

You can run this RESTful API application using this command:

```bash
bun run src/index.ts
```

or, you can install `pm2` and run it on background:

```bash
npm install -g pm2
pm2 start --name filesvr src/index.ts
```

---

Maintained by [@abel.dustin](https://gitlab.bahanatcw.com/abel.dustin)
