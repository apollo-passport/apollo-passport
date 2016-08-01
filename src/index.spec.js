import chai from 'chai';
import jwt from 'jsonwebtoken';

import ApolloPassport from './index';
import { defaultMapUserToJWTProps, defaultCreateTokenFromUser } from './index';

const should = chai.should();

const jwtSecret = 'xxx';
const requiredOptions = () => ({
  jwtSecret,
  db: { createUser: true, fetchUserByEmail: true }
});

describe('apollo-passport', () => {

  describe('default helpers', () => {

    describe('defaultMapUserToJWTProps', () => {
      it('maps from a user record to an object with a userId field', () => {
        const user = { id: 1 };
        defaultMapUserToJWTProps(user).should.deep.equal({ userId: 1 });
      });
    });

    describe('defaultCreateTokenFromUser', () => {
      it('x', () => {
        const context = {
          mapUserToJWTProps(user) { return { userId: user.id }; },
          jwtSecret
        };

        const user = { id: 1 };
        const token = defaultCreateTokenFromUser.call(context, user);

        const data = jwt.decode(token);
        delete data.iat;
        delete data.exp;
        data.should.deep.equal(context.mapUserToJWTProps(user));

      });
    });

  });

  describe('constructor()', () => {

    it('requires a valid db driver instance', () => {
      const options = requiredOptions();

      (function() {
        new ApolloPassport(options);
      }).should.not.throw();

      (function() {
        delete options.db;
        new ApolloPassport(options);
      }).should.throw();

      (function() {
        options.db = {};
        new ApolloPassport(options);
      }).should.throw();
    });

  });

  describe('use()', () => {

    const ap = new ApolloPassport(requiredOptions());
    ap.passport = { use() { } };
    ap.require = function(strategy, module) {
      switch(module) {
        case 'index':
          return function() {};
        case 'resolvers':
          return { RootMutation: {} };
        case 'schema':
          return [ '' ];
        case 'verify':
          return function() { return { _defaultVerify: true, self: this }; };
        case 'defaultOptions':
          return { _defaultOptions: true };
        default:
          throw new Error("No " + module);
      }
    }

    it('calls passport.use(new Strategy(options, boundVerify))', () => {
      const options = {};
      const verify = function() { return { self: this } };

      function FakeStrategy(options, boundVerify) {
        options.should.equal(options);
        boundVerify().self.should.equal(ap);
      }
      ap.use('local', FakeStrategy, options, verify)
    });

    it('accepts uses default options for missing options / verify', () => {
      function FakeStrategy1(options, boundVerify) {
        options.should.deep.equal({ _defaultOptions: true });
        boundVerify().should.deep.equal({ self: ap });
      }
      const verify = function() { return { self: this } };
      ap.use('local', FakeStrategy1, verify)

      function FakeStrategy2(options, boundVerify) {
        options.should.deep.equal({ _defaultOptions: true });
        boundVerify().should.deep.equal({ _defaultVerify: true, self: ap });
      }
      ap.use('local', FakeStrategy2);

    })

  });

  describe('extendsWith()', () => {
    it('extends the context', () => {
      const extensions = { a: 1 };
      const ap = new ApolloPassport(requiredOptions());
      ap.extendWith(extensions);
      ap.a.should.equal(1);
    });
  });

  describe('resolve()', () => {

  });

  describe('require()', () => {
    const es5name = './test-utils/sample-module-es5.js';
    const es5 = require(es5name);
    const es6name = './test-utils/sample-module-es6.js';
    const es6 = require(es6name);

    const ap = new ApolloPassport(requiredOptions());
    ap.resolve = function(module) {
      if (module.endsWith('es6'))
        return es6name;
      if (module.endsWith('es5'))
        return es5name;
      return null;
    };

    it('throws on unfound modules', () => {
      (function() {
        ap.require('non-existant', 'non-existant')
      }).should.throw();
    });

    it('returns a loaded, found module', () => {
      ap.require('local', 'es5').should.equal(es5);
      ap.require('local', 'es6').should.equal(es6.default);
    });

  });

  describe('schema()', () => {
    it('returns this._schema', () => {
      const ap = new ApolloPassport(requiredOptions());
      ap.schema().should.equal(ap._schema);
    });
  });

  describe('resolvers()', () => {
    it('returns a bound version of this._resolvers', () => {
      const ap = new ApolloPassport(requiredOptions());
      ap._resolvers = { a: 1 };
      ap._bindRootMutations = function(x) { return { ...x, _bound: 1 }; };
      ap.resolvers().should.deep.equal({ ...ap._resolvers, _bound: 1 });
    });
  });

  describe('expressMiddleware()', () => {

  });

  describe('wrapOptions() func', () => {

    const options = { a: 1 };
    const ap = new ApolloPassport(requiredOptions());
    const wrapper = ap.wrapOptions(options); // <-- returns async function!
    const reqAuthBearer = token => ({ headers: { authorization: `Bearer ${token}` }});

    it('returns the original options if no token in headers', async () => {
      (await wrapper({ headers: {} })).should.equal(options);

      (await wrapper({ headers: {
        authorization: 'Some unrecognized type'
      } })).should.equal(options);

      (await wrapper({ headers: {
        authorization: 'Bearer ' // empty token
      } })).should.equal(options);
    });

    // e.g. invalid token, jwt expired
    it('adds a jwtError to the context if one occurred', async () => {
      const token = jwt.sign({ userId: 1 }, 'a different secret');
      const result = await wrapper(reqAuthBearer(token));
      should.not.exist(result.context.auth);
      result.context.authError.name.should.equal('JsonWebTokenError');
      result.context.authError.message.should.equal('invalid signature');
    });

    it('adds the decoded value of a valid token to the context', async () => {
      const token = jwt.sign({ userId: 1 }, jwtSecret);
      const result = await wrapper(reqAuthBearer(token));
      result.context.auth.userId.should.equal(1);
    });
  });

  describe('_bindRootMutations()', () => {
    it('binds functions in RootMutations key (only)', () => {
      const resolvers = {
        a() { return this; },
        RootMutation: {
          x() { return this; }
        }
      };

      const ap = new ApolloPassport(requiredOptions());
      const bound = ap._bindRootMutations(resolvers);

      bound.a().should.not.equal(ap);
      bound.RootMutation.x().should.equal(ap);
    });
  });
  
});
