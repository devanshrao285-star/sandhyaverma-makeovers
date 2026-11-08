import { handleApi } from '../../../backend/src/composition/api';
import type { Env } from '../../../backend/src/adapters/security';
export const onRequest: PagesFunction<Env> = ({request,env}) => handleApi(request,env);
