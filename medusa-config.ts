import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  modules: [
    {
      resolve: "./src/modules/blog",
    },
  ],
    admin: {
    vite: () => {
      return {
        optimizeDeps: {
          include: ['@emotion/react', '@mui/material', 'react-table'],
        },
        server: {
          watch: {
            ignored: ['**/invoices/**'], // 👈 this ignores PDF file changes
          },
        },
      }
    },
  },
})
