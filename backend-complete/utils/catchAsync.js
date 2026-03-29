/**
 * catchAsync — wraps an async route handler so any thrown error
 * is forwarded to Express's error handler via next(err).
 *
 * Express 5 SHOULD do this automatically, but has a known bug with
 * certain async arrow function signatures. This wrapper guarantees it.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
