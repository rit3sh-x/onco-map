import { createTRPCRouter } from '../init';
import { dataRouter } from '@/modules/server/procedures';

export const appRouter = createTRPCRouter({
    data: dataRouter,
});

export type AppRouter = typeof appRouter;