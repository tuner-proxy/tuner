import { requestHandler } from './request.js';

export const finalize = () => requestHandler((req) => req.finalize());
