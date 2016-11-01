import path from 'path';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import _ from 'lodash';

import apAuthenticate from './authenticate';
import { mergeResolvers, mergeSchemas } from './utils/graphql-merge';


// Some super weird babel thing going on here, where path is not defined.
const _path = path;

// userId is non-standard, but superuseful.  Standards params are here:
// http://www.iana.org/assignments/jwt/jwt.xhtml
function defaultMapUserToJWTProps(user) {
  const userId = this.userId(user);

  let displayName = user.displayName;
  if (!displayName && user.services) {
    for (const service in user.services)
      if (user.services[service].displayName) {
        displayName = user.services[service].displayName;
        break;
      }
  }
  if (!displayName && user.username)
    displayName = user.username;
  if (!displayName && user.emails)
    displayName = user.emails[0].address; // .split('@', 1)[0];

  return { userId, displayName }
}

function defaultCreateTokenFromUser(user) {
  return jwt.sign(
    this.mapUserToJWTProps(user),
    this.jwtSecret,
    { expiresIn: "7 days" }
  );
}

class ApolloPassport {

  constructor(options = {}) {
    // TODO actually let's rather default to a DB request on each query if no jwt secret specified
    const jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    if (!jwtSecret && !options.createTokenFromUser)
      throw new Error("no jwtSecret nor a custom createTokenFromUser specified");

    this._useJwt = true;

    this.strategies = {};
    this._winston = options.winston || require('winston');
    this._resolvers = require('./resolvers').default;
    this._schema = require('./schema').default;
    this._authenticators = {};
    this.passport = options.passport || passport;

    this.apAuthenticate = apAuthenticate;

    this.ROOT_URL = options.ROOT_URL || process.env.ROOT_URL
      || (typeof ROOT_URL === 'string' && ROOT_URL);
    if (!this.ROOT_URL)
      throw new Error("No ROOT_URL set.  Please see Apollo Passport README");
    if (!this.ROOT_URL.endsWith('/'))
      this.ROOT_URL += '/';

    this.authPath = options.authPath || 'ap-auth';
    if (this.authPath.startsWith('/'))
      this.authPath = this.authPath.substr(1);

    this.authUrlRoot = this.ROOT_URL + this.authPath;

    this.assertIsDBDriver(options.db);
    this.db = options.db;

    this.jwtSecret = jwtSecret;
    this.mapUserToJWTProps = options.mapUserToJWTProps || defaultMapUserToJWTProps;
    this.createTokenFromUser = options.createTokenFromUser || defaultCreateTokenFromUser;
  }

  /**
   * Given a user object, return the userId field.  Preferentially uses
   * DBDriver#mapUserToUserId if it exists, otherwise tries user.id,
   * user._id and user.userId, which covers vast majority of cases.
   *
   * @param {object} user - a user object
   * @return {string} userId - the userId field
   */
  userId(user) {
    return (this.db.mapUserToUserId && this.db.mapUserToUserId(user))
      || user.id || user._id || user.userId;
  }

  /**
   * Sets user.id, user._id and user.userId.  Doubtful this will stick around,
   * if you use it for anything other than `createUser`, please open an issue
   * immediately.
   */
  setUserIdProp(user, userId) {
    // TODO This is horrible.  Let's rather DBDriver#createUser(user, true) to
    // return a user object with the id set, once we're sure nothing else uses
    // this, then deprecated with a warning.
    user.id = user._id = user.userId = userId;
  }

  assertIsDBDriver(db) {
    if (!db)
      throw new Error("Must provide a { db: DBDriverInstance } option");
    if (!(db.createUser && db.fetchUserByEmail))
      throw new Error("Option 'db' must be a valid DBDriver instance, e.g. "
        + "new RethinkDBDriverDash(r)");
  }

  use(nameArg, Strategy, options, verify) {
    const parts = nameArg.split(':', 2);
    const name = parts.pop(), namespace = parts.pop();

    if (!verify && typeof options === 'function') {
      verify = options;
      options = null;
    }

    const isAugmented = Strategy.__isAugmented;

    /*
     * Now that AugmentedStrategies include their own deps, let's aim to replace
     * this with an apolloPassport.addClass('oauth2') or something.
     */
    if (!options)
      options = this.require(name, 'defaultOptions', namespace, isAugmented /* optional */);
    if (!verify)
      verify = this.require(name, 'verify', namespace, isAugmented /* optional */);

    if (namespace === 'oauth' || namespace === 'oauth2') {
      if (!options.callbackURL)
        options.callbackURL = this.authUrlRoot + '/' + name + '/callback';
      // if (!options.profileFields)
      //  options.profileFields = // Passport converts these per strategy
      //    [ 'id', 'username', 'displayName', 'gender', 'emails', 'photos' ];
    }

    // console.log(options);

    if (isAugmented) {
      const instance = new Strategy(this, options);
      this.passport.use(instance.strategy);
      this.strategies[name] = instance;  // check up on this, conflit with non-augmented
      this._authenticators[name] = passport.authenticate(name); // options, etc. from below

      if (instance.resolvers)
        this._resolvers = mergeResolvers(this._resolvers, instance.resolvers);
      if (instance.schema)
        this._schema = [ mergeSchemas([this._schema[0], instance.schema[0]]) ];

      return;
    }

    const instance = new Strategy(options,
      namespace ? verify.bind(this, name) : verify.bind(this));
    this.passport.use(instance);

    // this._strategies.set(instance.name, instance);
    this.strategies[name] = instance;

    // TODO, make local use this too
    this._authenticators[name] = passport.authenticate(name);

    // Not used yet except for options (TODO serve on auth URL)
    if (options.scope)
      this.passport.authenticate(name, { scope: options.scope });

    const apWrapper = this.require(name, 'index', namespace, true /* optional */);
    if (apWrapper)
      this.strategies[name] = new apWrapper(this);

    if (apWrapper) {
      // back compat, new modules should include these without us needing to check
      if (!apWrapper.resolvers)
        apWrapper.resolvers = this.require(name, 'resolvers', namespace, true /* optional */);
      if (!apWrapper.schema)
        apWrapper.schema = this.require(name, 'schema', namespace, true /* optional */);
    }

    /*
    const resolvers = this.require(name, 'resolvers', namespace, true /* optional *//*);
    if (resolvers)
      this._resolvers = mergeResolvers(this._resolvers, resolvers);

    const schema = this.require(name, 'schema', namespace, true /* optional *//*);
    if (schema)
      this._schema = [ mergeSchemas([this._schema[0], schema[0]]) ];
    */

    // would also be nice to have a root query for available strategies
    // that could be used by the UI, and whether they are configured.
  }

  extendWith(obj) {
    _.extend(this, obj);
  }

  /////////////////////////////
  // require() and resolve() //
  /////////////////////////////

  resolve(module) {
    try {
      return require.resolve(module);
    } catch (err) {
      if (err.message === `Cannot find module '${module}'`) {

        /*
         * node resolves symlinks so that packages from npm link won't find
         * their own modules.  https://github.com/npm/npm/issues/5875
         * This is a small hack to make dev work easier.
         */
        if (module.charAt(0) !== '.') {
          const relative = _path.join(__dirname, '..', '..', module.replace(/apollo-passport-/, ''));
          try {
            return require.resolve(relative);
          } catch (err) {
            if (err.message !== `Cannot find module '${relative}'`)
              /* istanbul ignore next */
              throw err;
            return null;
          }
        }

        return null;
      }
      throw err;
    }
  }

  require(strategy, module, namespace, optional) {
    // No static analysis, but that's ok for server side
    const fromPackage = `apollo-passport-${strategy}/lib/${module}`;

    let resolved = this.resolve(fromPackage);
    if (!resolved)
      resolved = this.resolve(`./strategies/${strategy}/${module}`);
    if (!resolved && namespace)
      resolved = this.resolve(`apollo-passport-${namespace}/lib/${module}`);
    if (!resolved && namespace)
      resolved = this.resolve(`./strategies/${namespace}/${module}`);

    if (!resolved) {
      if (optional)
        return false;
      else
        throw new Error(`Cannot find '${fromPackage}'.  `
          + `Try 'npm i --save apollo-passport-${strategy}'.`);
    }

    const loaded = require(resolved);
    return loaded.__esModule ? loaded.default : loaded;
  }

  ///////////
  // Users //
  ///////////

  // accept 'emails', 'services' fields
  // return userId
  async createUser(user) {
    // pre hook

    const userId = await this.db.createUser(user);

    // post hook

    return userId;
  }

  //////////////////////
  // GraphQL & Apollo //
  //////////////////////

  schema() {
    const schemas = Array.from(this._schema);

    for (const key in this.strategies) {
      if (this.strategies[key].schema)
        schemas.push(this.strategies[key].schema[0]);
    }

    return [ mergeSchemas(schemas) ];
  }

  resolvers() {
    let resolvers = mergeResolvers({}, this._resolvers);

    for (const key in this.strategies) {
      if (this.strategies[key].resolvers)
        resolvers = mergeResolvers(resolvers, this.strategies[key].resolvers);
    }

    return this._bindRootQueriesAndMutations(resolvers);
  }

  /*
   * Wraps an apolloOptions object in a function that will check for a JWT
   * in an Authorization header, and if it passes verification, add to decoded
   * value to a 'auth' in the context.  If an error occured, adds to authError,
   * which is useful for debugging but can be safely ignored.
   */
  wrapOptions(options) {
    var self = this;

    return async function (req) {
      if (!req.headers.authorization)
        return options;

      const token = req.headers.authorization.substr(0, 7) === 'Bearer '
        && req.headers.authorization.substr(7);

      if (!token)
        return options;

      let decoded;
      try {
        decoded = jwt.verify(token, self.jwtSecret);
      } catch (err) {
        // This could be any number of reasons but in short: user not authed.
        // JsonWebTokenError: invalid signature
        // JsonWebTokenError: invalid token
        // TokenExpiredError: jwt expired
        // Passed as context.jwtError for debugging but can be safely ignored.
        return {
          ...options,
          context: { authError: err }
        };
      }

      return {
        ...options,
        context: { auth: decoded }
      };
    }
  }

  /*
   * Given a resolver object, it returns a new object, where every
   * function that is a sub-key of the RootMutation key will be bound
   * to the ApolloPassport instance (i.e. accessible via `this`).
   */
  _bindRootQueriesAndMutations(obj) {
    const out = {};
    for (const key in obj)
      if (key === 'RootMutation' || key === 'RootQuery') {
        out[key] = {};
        for (const key2 in obj[key])
          out[key][key2] = obj[key][key2].bind(this);
      } else {
        out[key] = obj[key];
      }
    return out;
  }

  /////////////////
  // Middlewares //
  /////////////////

  popupScript(data) {
    const json = JSON.stringify(data);

    // Indentation for maintainence only
    // Final string should be as small as possible to send over the wire
    return '' +
      '<html>' +
        '<head>' +
          '<script type="text/javascript">' +
            `window.opener.postMessage('apolloPassport ${json}', window.location.origin);` +
            'window.close();' +
          '</script>' +
        '</head>' +
      '</html>';
  }

  expressMiddleware() {
    var self = this;

    return function ApolloPassportExpressMiddleware(req, res /*, next */) {
      const optParts = req.url.split('?');
      const pathParts = optParts[0].split('/');
      const strategy = pathParts[1];
      const action = pathParts[2];

      self.apAuthenticate(strategy, req.query).then(data => {
        res.setHeader('content-type', 'text/html');
        res.end(self.popupScript(data), 'utf8');
      }).catch(error => {
        console.error(error);
        res.status(500, 'Internal server error');
        res.end();
      });
    }
  }

}

export { defaultMapUserToJWTProps, defaultCreateTokenFromUser };
export default ApolloPassport;
