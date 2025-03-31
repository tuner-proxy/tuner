import { requestHandler } from './request';

export const finalize = () => requestHandler((req) => req.finalize());
