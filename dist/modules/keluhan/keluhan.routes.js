"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const keluhan_controller_1 = require("./keluhan.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const ctrl = new keluhan_controller_1.KeluhanController();
router.use(auth_1.verifyJWTPasien);
router.get('/:id', ctrl.showKeluhan);
router.post('/:id', ctrl.updateKeluhan);
exports.default = router;
//# sourceMappingURL=keluhan.routes.js.map