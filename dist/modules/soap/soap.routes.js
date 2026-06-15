"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const soap_controller_1 = require("./soap.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../../config/env");
const storage = multer_1.default.diskStorage({
    destination: env_1.env.UPLOAD_PATH,
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `penunjang-${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(path_1.default.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        }
        else {
            cb(new Error('Format file tidak diizinkan. Gunakan PDF atau JPG.'));
        }
    },
});
const router = (0, express_1.Router)();
const ctrl = new soap_controller_1.SoapController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('dokter'));
router.get('/:kunjunganId', ctrl.showSoap);
router.post('/:kunjunganId/simpan', upload.single('file_penunjang'), ctrl.simpanSoap);
router.post('/:kunjunganId/koreksi', ctrl.simpanKoreksi);
exports.default = router;
//# sourceMappingURL=soap.routes.js.map