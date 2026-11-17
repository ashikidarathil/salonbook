import { isFulfilled, isPending, isRejected, type UnknownAction } from '@reduxjs/toolkit';

const anyPending = isPending();
const anyFulfilled = isFulfilled();
const anyRejected = isRejected();

type Guarded<G> = G extends (action: never) => action is infer T ? T : never;

/**
 * Loading/error matchers limited to the async thunks exported by one module.
 *
 * Plain `isPending` / `isRejected` match every thunk in the app, so a request
 * failing on another feature (e.g. reviews) would put this slice into an
 * error or loading state. Pass the slice's thunks module:
 *
 *   import * as thunks from './branch.thunks';
 *   const own = ownThunkMatchers(thunks);
 *   builder.addMatcher(own.pending, ...)
 */
export function ownThunkMatchers(thunks: Record<string, unknown>) {
  const prefixes = new Set(
    Object.values(thunks)
      .filter(
        (t): t is { typePrefix: string } =>
          typeof t === 'function' && typeof (t as { typePrefix?: unknown }).typePrefix === 'string',
      )
      .map((t) => t.typePrefix),
  );

  const isOwn = (action: UnknownAction) =>
    prefixes.has(action.type.replace(/\/(pending|fulfilled|rejected)$/, ''));

  return {
    pending: (action: UnknownAction): action is Guarded<typeof anyPending> =>
      anyPending(action) && isOwn(action),
    fulfilled: (action: UnknownAction): action is Guarded<typeof anyFulfilled> =>
      anyFulfilled(action) && isOwn(action),
    rejected: (action: UnknownAction): action is Guarded<typeof anyRejected> =>
      anyRejected(action) && isOwn(action),
  };
}
