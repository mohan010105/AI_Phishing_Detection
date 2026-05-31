import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import scanRouter from "./scan.js";
import dashboardRouter from "./dashboard.js";
import adminRouter from "./admin.js";
import assistantRouter from "./assistant.js";
import uploadsRouter from "./uploads.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(scanRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(assistantRouter);
router.use(uploadsRouter);

export default router;
