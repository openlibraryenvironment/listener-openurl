/*
  Detail is by default omitted from 5xx errors. Fix with:

        const err = new Error(e.stack);
        err.status = 500;
        err.expose = true;
        throw err;
*/

class HttpError extends Error {
  constructor(response, comment) {
    super(`${response.status} for ${response.url}${comment ? `: ${comment}` : ''}`);
    this.name = 'HttpError';
    this.response = response;
    this.comment = comment;
  }
}

module.exports = HttpError;
