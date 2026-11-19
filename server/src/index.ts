import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { authRouter, logDemoAccounts } from "./routes/auth.js"
import { queuesRouter } from "./routes/queues.js"
import { isSupabaseConfigured } from "./supabase.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(
  cors({
    origin: "*", // Izinkan semua akses lokal / client
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Klinik Sehat Express API is running",
    supabaseConnected: isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  })
})

// Mount Routes
app.use("/api", authRouter)
app.use("/api/queues", queuesRouter)

// Global Error Handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Server Error]:", err.stack)
    res.status(500).json({ success: false, error: "Internal Server Error" })
  },
)

app.listen(PORT, () => {
  console.log(`🚀 [Klinik Sehat API] Server aktif di http://localhost:${PORT}`)
  console.log(`📡 [Health Check] http://localhost:${PORT}/api/health`)
  console.log(
    `📋 [Mode Database] ${
      isSupabaseConfigured
        ? "Supabase (PostgreSQL)"
        : "In-Memory Development Mode"
    }`,
  )
  logDemoAccounts()
})
