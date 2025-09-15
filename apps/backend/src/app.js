// apps/backend/src/app.js
import express from "express";
import cors from "cors";
import { router as doctorContract } from "./routes/contract.doctors.routes.js";
import { router as apptContract } from "./routes/contract.appointments.routes.js";
// opcional pacientes
// import { router as patientContract } from "./routes/contract.patients.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/doctors", doctorContract);
app.use("/api/appointments", apptContract);
// app.use("/api/patients", patientContract);

app.use(errorMiddleware);
