import path from 'path';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { mergeResolvers, mergeSchemas } from './utils/graphql-merge';
import _ from 'lodash';

// Some super weird babel thing going on here, where path is not defined.
const _path = path;

// Non-standard, see
// http://www.iana.org/assignments/jwt/jwt.xhtml
const defaultMapUserToJWTProps = user => ({ userId: user.id });

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
    this.passport = passport;

    // const userTableName = options.userTableName || 'users';

    this.assertIsDBDriver(options.db);
    this.db = options.db;

    this.jwtSecret = jwtSecret;
    this.mapUserToJWTProps = options.mapUserToJWTProps || defaultMapUserToJWTProps;
    this.createTokenFromUser = options.createTokenFromUser || defaultCreateTokenFromUser;
  }

  assertIsDBDriver(db) {
    if (!db)
      throw new Error("Must provide a { db: DBDriverInstance } option");
    if (!(db.createUser && db.fetchUserByEmail))
      throw new Error("Option 'db' must be a valid DBDriver instance, e.g. "
        + "new RethinkDBDriverDash(r)");
  }

  use(name, Strategy, options, verify) {
    if (!verify) {
      verify = options;
      options = null;
    }

    if (!options)
      options = this.require(name, 'defaultOptions');
    if (!verify)
      verify = this.require(name, 'verify');

    const instance = new Strategy(options, verify.bind(this));
    this.passport.use(instance);
    //this._strategies.set(instance.name, instance);

    const apWrapper = this.require(name, 'index');
    this.strategies[name] = new apWrapper(this);

    const resolvers = this.require(name, 'resolvers');
    this._resolvers = mergeResolvers(this._resolvers, resolvers);

    const schema = this.require(name, 'schema');
    this._schema = [ mergeSchemas([this._schema[0], schema[0]]) ];

    // would also be nice to have a root query for available strategies
    // that could be used by the UI, and whether they are configured.
  }

  extendWith(obj) {
    _.extend(this, obj);
  }

  /* resolve, require */

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
          const relative = _path.join(__dirname, '..', '..', module);
          try {
            return require.resolve(relative);
          } catch (err) {
            if (err.message !== `Cannot find module '${relative}'`)
              throw err;
            return null;
          }
        }

        return null;
      }
      throw new err;
    }
  }

  require(strategy, module) {
    // No static analysis, but that's ok for server side
    const fromPackage = `apollo-passport-${strategy}/lib/${module}`;
    
    let resolved = this.resolve(fromPackage);
    if (!resolved)
      resolved = this.resolve(`./strategies/${strategy}/${module}`);
    if (!resolved)
      throw new Error(`Cannot find '${fromPackage}'.  `
        + `Try 'npm i --save apollo-passport-${strategy}'.`);

    const loaded = require(resolved);
    return loaded.__esModule ? loaded.default : loaded;
  }

  /* graphql, apollo */

  schema() {
    return this._schema;
  }

  resolvers() {
    return this._bindRootMutations(this._resolvers);
  }

  expressMiddleware(path = '/ap-auth') {
    return function ApolloPassportExpressMiddleware(req, res, next) {
      console.log('!!!', req.url);
    }
  }

  /*
   * Wraps an apolloOptions object in a function that will check for a JWT
   * in an Authorization header, and if it passes verification, add to decoded
   * value to a 'jwt' in the context.  If an error occured, adds to jwtError,
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
          context: { jwtError: err }
        };
      }

      return {
        ...options,
        context: { jwt: decoded }
      };
    }
  }

  /*
   * Given a resolver object, it returns a new object, where every
   * function that is a sub-key of the RootMutation key will be bound
   * to the ApolloPassport instance (i.e. accessible via `this`).
   */
  _bindRootMutations(obj) {
    const out = {};
    for (const key in obj)
      if (key === 'RootMutation') {
        out.RootMutation = {};
        for (const key2 in obj.RootMutation)
          out.RootMutation[key2] = obj.RootMutation[key2].bind(this);
      } else {
        out[key] = obj[key];
      }
    return out;
  }

}

export { defaultMapUserToJWTProps, defaultCreateTokenFromUser };
export default ApolloPassport;
