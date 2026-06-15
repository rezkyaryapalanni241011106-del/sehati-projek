"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new admin_controller_1.AdminController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('admin', 'super_admin'));
router.get('/', ctrl.ringkasan);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map