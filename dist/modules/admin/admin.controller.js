"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_model_1 = require("./admin.model");
class AdminController {
    constructor() {
        this.ringkasan = async (req, res) => {
            const stats = await this.model.getRingkasan();
            res.render('admin/ringkasan', { title: 'Ringkasan Admin', ...stats });
        };
        this.model = new admin_model_1.AdminModel();
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map