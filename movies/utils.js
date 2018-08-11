const fetch = require('node-fetch');
const fs = require('fs');
const https = require('https');
const humps = require('humps');

/**
  * Returns an IAM policy document for a given user and resource.
  * @param {String} principalId User Id
  * @param {String} Effect      Allow / Deny
  * @param {String} Resource    Resource ARN
  * @param {String} context     Response context
  * @returns {Object}           PolicyDocument
  */
const getIAMPolicy = (principalId, Effect, Resource, context) => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect,
          Resource
        },
      ],
    },
    context
  };
};
module.exports.getIAMPolicy = getIAMPolicy;

/**
 * Adds a timestamp to the end of a url to prevent caching
 * @param {string} url  Any URL
 * @return {string}     URL + timestamp
 */
const getNoCacheUrl = (url) => {
  const now = Date.now();
  return url.includes('?') ? `${url}&${now}` : `${url}?${now}`;
};
module.exports.getNoCacheUrl = getNoCacheUrl;

/**
 * Adds the HTTPS agent to the fetch request options
 * @param {Object} opts Fetch request options
 * @return {Object}     HTTPS fetch request options
 */
const getHTTPSOpts = (opts) => {
  return merge(opts, { agent: HTTPSAgent });
};
module.exports.getHTTPSOpts = getHTTPSOpts;

/**
 * @type {Object}
 * HTTPS agent for secure localhost requests
 */
const HTTPSAgent = new https.Agent({
  ca: fs.readFileSync('auth/cert.pem'), 
});
module.exports.HTTPSAgent = HTTPSAgent;

/**
 * Is the user authorized to acess the AWS resource?
 * @param {Array<string>} scopes  List of user access scopes
 * @param {string} methodArn      Lambda AWS ARN
 * @return {boolean}              True, if user is authorized; false, otherwise
 */
const isAuthorized = (scopes, methodArn) => {
  if (scopes.includes('*')) {
    return true;
  }

  for (const scope of scopes) {
    if (methodArn.includes(scope)) {
      return true;
    }
  }

  return false;
};
module.exports.isAuthorized = isAuthorized;

/**
 * Merges any number of JavaScript objects into a single object.
 * Objects are folded-right, so that the right most object is
 * given priority.
 * @param {Objects} ...objs Any number of JavaScript objects
 * @return {Object}         Merged objects
 */
const merge = (...objs) => {
  return objs.reduce((merged, obj) => {
    return Object.assign({}, merged, obj);
  });
};

/**
 * Wraps a request with proper no caching,
 * HTTPS cert, & error handling, then returns the
 * json response with camel-cased keys.
 * @param {string} url  URL
 * @param {Object} opts Fetch options
 * @return {*}          Response
 */
const req = async (url, opts) => {
  const noCacheUrl = getNoCacheUrl(url);
  const httpsOpts = url.includes('https') ? getHTTPSOpts(opts) : opts;
  const res = await fetch(noCacheUrl, httpsOpts);

  if (res.status < 600 && res.status >= 400) {
    const err = await res.json();
    console.error('~~~ Request Error', JSON.stringify(err, null, 2));
    throw new Error(err);
  }

  const json = await res.json();

  return humps.camelizeKeys(json);
};
module.exports.req = req;
