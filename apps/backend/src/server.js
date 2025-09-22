// apps/backend/src/server.js
import { app } from "./app.js";
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
