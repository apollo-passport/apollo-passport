import proxyquire from 'proxyquire';
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

// might be useful elsewhere too...
const passportStub = {
  authenticate(name, callback) {
    return function(req) {
      if (!req)
        throw new Error("no req");
      if (!req.query)
        throw new Error("no req.query");

      const override = req.query.override;
      if (!override)
        throw new Error("no req.query.override");

      switch (override) {
        case 'error': return callback(new Error());
        case 'user': return callback(null, { id: 1 });
        case 'info': return callback(null, null, 'info');
        default: throw new Error("Invalid req.query.override: " + override);
      }
    }
  }
}

const context = {
  createTokenFromUser: () => 'token'
};

const resolvers = proxyquire('./resolvers', { passport: passportStub }).default;

describe('resolvers', () => {

  describe('passportStub', () => {

    it('throws on missing or invalid values', () => {

      (function() {
        passportStub.authenticate()();
      }).should.throw();

      (function() {
        passportStub.authenticate()({});
      }).should.throw();

      (function() {
        passportStub.authenticate()({ query: {} });
      }).should.throw();

      (function() {
        passportStub.authenticate()({ query: { override: 'error' }});
      }).should.throw();

      (function() {
        passportStub.authenticate()({ query: { override: 'invalid' }});
      }).should.throw();

    });

  });

  describe('local', () => {

    describe('passportLoginEmail', () => {

      const passportLoginEmail
        = resolvers.RootMutation.passportLoginEmail.bind(context);

      it('throws on a real error', () => {
        // I don't know how to check if an async function throws
        passportLoginEmail(null, { override: 'error' }).should.be.rejected;
      });

      it('passes the user', async () => {
        const result = await passportLoginEmail(null, { override: 'user' });
        result.error.should.equal("");
        result.token.should.equal('token');
      });

      it('passes an error string (not a throw)', async () => {
        const result = await passportLoginEmail(null, { override: 'info' });
        result.error.should.equal("info");
        result.token.should.equal("");
      });

    });

  });

});