import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { PatientsContractController as C } from "../controllers/contract.patients.controller.js";
import { PacienteCreateDTO, PacienteUpdateDTO, PacienteListQuery } from "../contracts/schemas.js";

export const router = Router();

router.get("/", validate(PacienteListQuery), C.list);
router.post("/", validate(PacienteCreateDTO), C.create);
router.patch("/:id", validate(PacienteUpdateDTO), C.update);
router.delete("/:id", C.remove);
