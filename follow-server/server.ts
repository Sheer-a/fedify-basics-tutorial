import { serve } from "@hono/node-server";
import { behindProxy } from "x-forwarded-fetch";
import { createFederation, MemoryKvStore, Person } from "@fedify/fedify";
import { configure, getConsoleSink } from "@logtape/logtape";
import { AsyncLocalStorage } from "node:async_hooks";

await configure({
  contextLocalStorage: new AsyncLocalStorage(),
  sinks: { console: getConsoleSink() },
  filters: {},
  loggers: [
    { category: "fedify",  sinks: ["console"], lowestLevel: "info" },
  ],
});

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
});

federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
  if (identifier !== "me") return null;  // Other than "me" is not found.
  return new Person({
    id: ctx.getActorUri(identifier),
    name: "Me",  // Display name
    summary: "This is me!",  // Bio
    preferredUsername: identifier,  // Bare handle
    url: new URL("/", ctx.url),
  });
});

serve({
  port: 3000,
  fetch: behindProxy((request) => federation.fetch(request, { contextData: undefined })),
});


// node --import tsx server.ts