"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLog_controller_1 = require("./auditLog.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new auditLog_controller_1.AuditLogController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('super_admin'));
router.get('/', ctrl.overviewSistem);
router.get('/log', ctrl.listAuditLog);
exports.default = router;
//# sourceMappingURL=auditLog.routes.js.map