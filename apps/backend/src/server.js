// apps/backend/src/server.js
import { app } from "./app.js";
import botRoutes from "./routes/bot.routes.js";

const PORT = process.env.PORT || 8000;

// monta rutas ANTES de listen
app.use("/api", botRoutes);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
