import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
import { createFormSchema, updateFormSchema } from "./form.schema";
import { saveBuilderSchema } from "./builder.schema";
import * as controller from "./form.controller";

const router = Router();

// ---------------------------------------------------------------------------
// Public route — no auth required (respondents accessing via share link)
// Must be defined before /:id to avoid the slug being treated as an id.
// ---------------------------------------------------------------------------
router.get("/public/:slug", controller.getPublicForm);

// ---------------------------------------------------------------------------
// Org-member routes — authentication + org membership required for all
// ---------------------------------------------------------------------------
router.use(requireAuth, requireOrgMember);

router.get("/", controller.listForms);
router.post("/", validate(createFormSchema), controller.createForm);
router.get("/:id", controller.getForm);
router.patch("/:id", validate(updateFormSchema), controller.updateForm);
router.patch("/:id/publish", controller.togglePublish);
router.patch("/:id/builder", validate(saveBuilderSchema), controller.saveBuilder);
router.post("/:id/duplicate", controller.duplicateForm);
router.delete("/:id", controller.deleteForm);

export default router;