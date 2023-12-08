type OkResult<T> = {
  ok: true;
  data: T;
};

type ErrorResult<T> = {
  ok: false;
  error: T;
};

export type Result<T, U> = OkResult<T> | ErrorResult<U>;
