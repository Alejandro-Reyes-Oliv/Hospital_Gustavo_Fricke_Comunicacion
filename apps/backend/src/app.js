import express from "express";
import cors from "cors";
import { router as doctorRouter } from "./routes/doctor.routes.js";
import { router as citaRouter } from "./routes/cita.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ name: 'HGF API', status: 'ok' }));


app.use("/api/doctores", doctorRouter);
app.use("/api/citas", citaRouter);

app.use(errorMiddleware);

export default app;
