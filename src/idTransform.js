// Applies configuration used to transform SSO user ids into those recognised by NCIP

function idTransform(id, cfg) {
  if (typeof id !== 'string') return id;
  let result = id;
  if (cfg.reqIdToUpper) result = result.toUpperCase();
  if (cfg.reqIdToLower) result = result.toLowerCase();
  if (cfg.reqIdRegex && cfg.reqIdReplacement) {
    result = result.replace(RegExp(cfg.reqIdRegex), cfg.reqIdReplacement);
  }
  return result;
};

module.exports = idTransform;
