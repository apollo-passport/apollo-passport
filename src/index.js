import passport from 'passport';
import jwt from 'jsonwebtoken';

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

    this._strategies = new Map();
    this._winston = options.winston || require('winston');

    this.dbName = options.db[0];
    const userTableName = options.userTableName || 'users';

    const DBDriver = require(`./db/${this.dbName}`).default;
    this.db = new DBDriver(options.db[1], userTableName);

    this.jwtSecret = jwtSecret;
    this.mapUserToJWTProps = options.mapUserToJWTProps || defaultMapUserToJWTProps;
    this.createTokenFromUser = options.createTokenFromUser || defaultCreateTokenFromUser;
  }

  use(name, Strategy, options, verify) {
    if (!verify) {
      verify = options;
      options = null;
    }

    if (!options)
      options = this.require(name, 'defaultOptions');
    if (!verify)
      verify = this.dbRequire(name, 'verify');

    const instance = new Strategy(options, verify.bind(this));
    passport.use(instance);

    //this._strategies.set(instance.name, instance);
  }

  require(strategy, module) {
    // No static analysis, but that's ok for server side
    let loaded = require(`./strategies/${strategy}/${module}`);
    return loaded.default;
  }

  dbRequire(strategy, module) {
    return this.require(strategy, `db/${this.dbName}/${module}`);
  }

  schema() {
    return require('./schema').default;
  }

  resolvers() {
    return this._bindRootMutations(require('./resolvers').default);
  }

  expressMiddleware(path = '/ap-auth') {
    return function ApolloPassportExpressMiddleware(req, res, next) {
      console.log('!!!', req.url);
    }
  }

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

export default ApolloPassport;
