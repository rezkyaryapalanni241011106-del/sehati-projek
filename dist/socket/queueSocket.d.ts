import { Server as SocketServer } from 'socket.io';
export declare function setupQueueSocket(io: SocketServer): void;
export declare function emitQueueUpdate(io: SocketServer, doctorId: string, action: 'add' | 'remove' | 'skip' | 'standby_back', payload: Record<string, unknown>): void;
//# sourceMappingURL=queueSocket.d.ts.map