"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitungIMT = hitungIMT;
exports.kategoriIMT = kategoriIMT;
function hitungIMT(beratKg, tinggiCm) {
    if (beratKg <= 0 || tinggiCm <= 0)
        return 0;
    const tinggiM = tinggiCm / 100;
    return parseFloat((beratKg / (tinggiM * tinggiM)).toFixed(2));
}
function kategoriIMT(imt) {
    if (imt < 18.5)
        return 'Berat badan kurang';
    if (imt < 25.0)
        return 'Normal';
    if (imt < 27.0)
        return 'Kelebihan berat badan';
    if (imt < 30.0)
        return 'Obesitas I';
    return 'Obesitas II';
}
//# sourceMappingURL=imt.js.map