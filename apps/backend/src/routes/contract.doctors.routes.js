import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { DoctorsContractController as C } from "../controllers/contract.doctors.controller.js";
import { DoctorCreateDTO, DoctorUpdateDTO, DoctorListQuery } from "../contracts/schemas.js";

export const router = Router();

router.get("/", validate(DoctorListQuery), C.list);
router.post("/", validate(DoctorCreateDTO), C.create);
router.patch("/:id", validate(DoctorUpdateDTO), C.update);
router.delete("/:id", C.remove);