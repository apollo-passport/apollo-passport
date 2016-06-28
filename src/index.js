import passport from 'passport';

class ApolloPassport {

  constructor(options) {
    this._strategies = new Map();
    this._winston = options.winston || require('winston');

    this.dbName = options.db[0];
    const userTableName = options.userTableName || 'users';

    const DBDriver = require(`./db/${this.dbName}`).default;
    this.db = new DBDriver(options.db[1], userTableName);
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
    return require('./resolvers').default;
  }

  expressMiddleware(path = '/ap-auth') {
    return function ApolloPassportExpressMiddleware(req, res, next) {
      console.log('!!!', req.url);
    }
  }
}

export default ApolloPassport;
