import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userRoutes } from "./routes/user";
import { fileRoutes } from "./routes/file";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "File Server | Bahana TCW Investment Management",
          description: "File Server | A backup file storage for BahanaTCW API",
          version: "1.0.0",
        },
        tags: [
          { name: "User", description: "Authentication Enpoints" },
          { name: "File", description: "File Endpoints" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
      provider: "scalar",
      scalarConfig: {
        darkMode: true,
        forceDarkModeState: "dark",
        layout: "modern",
        metaData: {
          author: "Bahana TCW Investment Management",
          applicationName: "File Server",
          charset: "utf-8",
          creator: "Bahana TCW Investment Management",
          colorScheme: "dark light",
          description:
            "File Server | A backup file storage for Bahana Link and ONE by IFG",
          google: null,
          googleSiteVerification: null,
          googlebot: null,
          googlebotNews: null,
          ogLocale: "id-ID",
          ogLocaleAlternate: "en-US",
          publisher: "Bahana TCW Investment Management",
          rating: null,
          title: "File Server",
        },
        hideDarkModeToggle: true,
        theme: "solarized",
      },
    }),
  )
  .use(cors())
  .use(userRoutes)
  .use(fileRoutes)
  .listen(3000);

console.log(
  `💫 File Server is running at ${app.server?.hostname}:${app.server?.port}`,
);
