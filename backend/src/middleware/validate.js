import { AppError } from '../utils/errors.js';

const validatedKey = {
  body: 'validatedBody',
  query: 'validatedQuery',
  params: 'validatedParams',
};

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new AppError('VALIDATION_ERROR', 'Invalid request data', 400, result.error.flatten())
      );
    }
    req[validatedKey[source] ?? 'validatedBody'] = result.data;
    return next();
  };
}
