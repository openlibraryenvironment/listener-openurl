class HTTPError extends Error {
  constructor(response, comment) {
    let status, url;
    if (typeof response === 'number') {
      status = response;
      url = undefined;
    } else {
      status = response.status;
      url = response.url;
    }

    const maybeFor = url ? ` for ${url}` : '';
    super(`${status}${maybeFor}: ${comment}`);
    this.response = response;
    this.name = 'HTTPError';
    this.status = status;
    this.expose = true; // Not true by default for 500 errors
    this.comment = comment;
  }
}

module.exports = HTTPError;
