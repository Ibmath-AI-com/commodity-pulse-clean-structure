export class AuthenticationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class UnauthenticatedError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class UserDisabledError extends Error {
  constructor(message = "User is disabled") {
    super(message);
    this.name = "UserDisabledError";
  }
}

export class InputParseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

