# tRPC In Next.js with React Query

## Inital Setup

### Add Dependencies

```bash
npm install @trpc/server@next @trpc/client@next @trpc/react-query@next @trpc/next@next @tanstack/react-query@latest zod
```

### Init tRPC and Router

In `server/` create:

Server and Router:

```ts
// trpc.ts
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

AppRouter:

```ts
// index.ts
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
	getTodos: publicProcedure.query(async () => {
		return [10, 20, 30, 40];
	}),
});

export type AppRouter = typeof appRouter;
```

### tRPC Next.js Instance

In `app/api/trpc/[trpc]` create the instance.

```ts
// route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server";

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => ({}),
	});

export { handler as GET, handler as POST };
```

### Create tRPC React Client

In `app/_trpc` create

Client:

```ts
// client.ts
import { AppRouter } from "@/server";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>({});
```

Provider:

```tsx
// Provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { trpc } from "./client";
import { httpBatchLink } from "@trpc/react-query";

export default function Provider({ children }: { children: ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: "http://localhost:3000/api/trpc",
				}),
			],
		})
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
```

### Apply Provider:

```tsx
// layout.tsx
...
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
```

## Usage Component

Take a example of a component usage w/tRPC:

```tsx
// TodoList.tsx
"use client";
import { trpc } from "@/app/_trpc/client";

export default function TodoList() {
	const getTodos = trpc.getTodos.useQuery();

	return (
		<div>
			<div>{JSON.stringify(getTodos.data)}</div>
		</div>
	);
}
```

## Drizzle Setup

### Add Dependencies

```bash
npm install drizzle-orm better-sqlite3 drizzle-kit
```

```bash
npm install @types/better-sqlite3 --save-dev
```

### Create Schema

```ts
// db/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
	id: integer("id").primaryKey(),
	content: text("content"),
	done: integer("done"),
});
```

### Create Drizzle Config

```ts
// drizzle.config.ts
import { Config } from "drizzle-kit";

export default {
	schema: "../db/schema.ts",
	out: "./drizzle",
	driver: "better-sqlite",
	dbCredentials: {
		url: "sqlite.db",
	},
} satisfies Config;
```

### Generate Migrations

```bash
npm drizzle-kit generate:sqlite
```

### Use Drizzle from tRPC

Change `server/index.ts`:

```ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";

import { publicProcedure, router } from "./trpc";

import { todos } from "@/db/schema";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "drizzle" });

export const appRouter = router({
	getTodos: publicProcedure.query(async () => {
		return await db.select().from(todos).all();
	}),
});

export type AppRouter = typeof appRouter;
```
