import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { AppointmentsContractController as C } from "../controllers/contract.appointments.controller.js";
import {
  CitaCreateDTO,
  CitaUpdateDTO,
  CitaListQuery,
  BulkStatusDTO, // ← este nombre debe existir en schemas.js
} from "../contracts/schemas.js";

export const router = Router();

// Debug opcional si vuelve a fallar:
// console.log("[appointments routes] C.create:", typeof C?.create);

router.get("/", validate(CitaListQuery), C.list);
router.post("/", validate(CitaCreateDTO), C.create);
router.patch("/:id", validate(CitaUpdateDTO), C.update);
router.patch("/", validate(BulkStatusDTO), C.bulkStatus);
router.delete("/:id", C.remove);
router.post("/send-bot", C.sendBot);
