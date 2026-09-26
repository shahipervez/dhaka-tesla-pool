import { Router } from "express";
import { AREAS } from "../domain/geography.js";

export const metaRouter = Router();

metaRouter.get("/areas", (_req, res) => {
  res.json({
    areas: AREAS.map((value) => ({
      value,
      label: value.replaceAll("_", " ")
    }))
  });
});
