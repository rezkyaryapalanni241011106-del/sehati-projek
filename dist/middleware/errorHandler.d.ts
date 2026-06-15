import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
export declare const logger: winston.Logger;
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map