class QueryError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'QueryError';
    this.type = type;
    this.details = details;
  }
}

module.exports = { QueryError };
