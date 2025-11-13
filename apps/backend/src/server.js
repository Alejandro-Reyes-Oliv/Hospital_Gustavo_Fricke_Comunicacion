// apps/backend/src/server.js
import { app } from "./app.js";
import botRoutes from "./routes/bot.routes.js";
import { startReminderScheduler } from "./services/recordatorioService.js";

const PORT = process.env.PORT || 8080;

app.use("/api", botRoutes);

startReminderScheduler();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
