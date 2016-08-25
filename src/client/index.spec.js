import ApolloPassport from './index';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'regenerator-runtime/runtime';

const should = chai.should();
chai.use(sinonChai);

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
const decodedToken = {
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
};

global.window = global;
const localStorage = window.localStorage = {
  items: {},
  getItem: (name) => localStorage.items[name],
  setItem: (name, value) => localStorage.items[name] = value,
  removeItem: (name) => delete localStorage.items[name]
};

window.addEventListener = function() {};

window.location = {
  // sinon relies on location.protocol if window is defined
  // in /sinon/lib/sinon/util/fake_server.js
  protocol: 'http',
  // For messaging checks
  origin: 'origin'
};

// Synchronous promise stub
function FakeResolve(value) {
  return () => ({
    then(then) {
      then(value);
      return {
        // catch(err) { throw err; }
      }
    }
  });
}

// Miminal options necessary for constructor to init, skipping non-specific tests
const minOpts = {
  apolloClient: {
    query: () => ({ then() {} })   // i.e. skip / no-op
  }
};

describe('ApolloPassport - client', () => {

  describe('- constructor', () => {

    it('instantiates correctly', () => {
      const ap = new ApolloPassport(minOpts);
      ap.apolloClient.should.equal(minOpts.apolloClient);
    });

    it('runs assertToken if a token exists in localStorage', (done) => {
      localStorage.setItem('apToken', token);
      const ap = new ApolloPassport(minOpts);
      ap.assertToken = function() {
        ap._token.should.equal(token);
        done();
      };
    });

  });

  describe('- internal', () => {

    describe('_runDiscovery', () => {

      it('throws on errors', () => {
        const apolloClient = {
          query: FakeResolve({
            errors: []
          })
        };
        (function () {
          new ApolloPassport({ apolloClient });
        }).should.throw();
      });

      it('sets .discovered, builds .open', () => {
        const discoveryData = {
          ROOT_URL: 'ROOT_URL',
          authPath: 'ap-auth',
          services: [
            {
              type: 'oauth',
              name: 'footbook',
              urlStart: 'http://my.service/oauth/auth'
            },
            {
              type: 'oauth2',
              name: 'meower',
              urlStart: 'http://my.service/oauth/auth'
            }
          ]
        };
        const apolloClient = {
          query: FakeResolve({ data: { apDiscovery: discoveryData } })
        };
        const ap = new ApolloPassport({ apolloClient });

        ap.discovered.should.equal(discoveryData);

        ap.discovered.services[0].open.should.exist;
        ap.discovered.services[1].open.should.exist;
      });

    });

  });

  describe('- messaging', () => {

    describe('receiveMessage()', () => {
      const ap = new ApolloPassport(minOpts);

      it('skips irrelevent messages', () => {
        ap.loginComplete = sinon.spy();

        ap.receiveMessage({ origin: 'not-origin', data: "apolloPassport {}" });
        ap.loginComplete.should.not.have.been.called;

        ap.receiveMessage({ origin: window.location.origin, data: {} });
        ap.loginComplete.should.not.have.been.called;
      });

      it('calls loginComplete', () => {
        ap.loginComplete = sinon.spy();
        const data = { type: 'loginComplete', key: 'key' };
        const dataStr = 'apolloPassport ' + JSON.stringify(data);
        ap.receiveMessage({ origin: window.location.origin, data: dataStr });
        ap.loginComplete.should.have.been.calledWith(data, data.key);
      });

      it('throws on invalid key', () => {
        const data = { type: 'unknown' };
        const dataStr = 'apolloPassport ' + JSON.stringify(data);
        (function () {
          ap.receiveMessage({ origin: window.location.origin, data: dataStr });
        }).should.throw();
      });
    });

  });

  describe('- modules', () => {

    it('can be used', () => {
      const ap = new ApolloPassport(minOpts);
      const TestStrategy = function() {};
      ap.use('test', TestStrategy);
      ap.strategies.test.should.be.an.instanceof(TestStrategy);
    });

    it('can extend the instance', () => {
      const ap = new ApolloPassport(minOpts);
      const methods = { a: {} };
      ap.extendWith(methods);
      ap.a.should.equal(methods.a);
    });

  });

  describe('- actions -', () => {

    it('loginStart()', () => {

    });

    describe('loginComplete()', () => {

      it('handles errors', () => {
        const ap = new ApolloPassport(minOpts);
        const result = {
          errors: []
        };

        ap.loginComplete(result, 'unused');
        // Nothing to test for for now.
      });

      it('sets state on success', () => {
        const ap = new ApolloPassport(minOpts);
        const result = {
          data: {
            passportLoginEmail: { token }
          }
        };

        ap.loginComplete(result, 'passportLoginEmail');
        ap.getState().should.deep.equal({
          data: decodedToken,
          verified: true,
          error: null
        });
      });

      it('sets state on error', () => {
        const ap = new ApolloPassport(minOpts);
        const result = {
          data: {
            passportLoginEmail: { error: "something" }
          }
        };

        ap.loginComplete(result, 'passportLoginEmail');
        ap.getState().should.deep.equal({
          data: {},
          verified: false,
          error: "something"
        });
      });

    });

    it('logout() clears state & local storage', () => {
      const ap = new ApolloPassport(minOpts);

      localStorage.setItem('apToken', 'a');
      ap.setState({ data: decodedToken, verified: true, error: null });

      ap.logout();

      const state = ap.getState();
      state.data.should.deep.equal({});
      state.verified.should.be.false;
    });

  });

  describe('- state', () => {

    it('allows removal subscribers', () => {
      const ap = new ApolloPassport(minOpts);
      const test = function() {};

      ap.subscribe(test);
      ap.unsubscribe(test);
      ap._subscribers.has(test).should.be.false;
    });

    // subscribe+emitState tested in redux suite below.
  });

  describe('- optional redux support', () => {

    describe('- reducer', () => {

      const ap = new ApolloPassport(minOpts);
      const reducer = ap.reducer();
      const state = {};

      it('changes state on APOLLO_PASSPORT_UPDATE', () => {
        reducer({}, {
          type: 'APOLLO_PASSPORT_UPDATE',
          state: state
        }).should.equal(state);
      });

      it('should return given state on non matching action', () => {
        reducer(state, {}).should.equal(state);
      });

      it('should return getState as initial value', () => {
        reducer(undefined, {}).should.equal(ap.getState());
      });

    });

    describe('- middleware', () => {

      it('keeps ref to store and returns identity middleware', () => {

        const ap = new ApolloPassport(minOpts);
        const middleware = ap.middleware();
        const store = {};
        const m = middleware(store);
        ap.store.should.equal(store);

        // test the identity middleware
        const action = {};
        m(() => action.test = 1)(action);
        action.test.should.equal(1);
      });

      it('updates redux state on apolloPassport state changes', (done) => {

        const ap = new ApolloPassport(minOpts);
        const middleware = ap.middleware();
        const nextState = { data: {}, verified: true, error: null };
        const store = {
          dispatch(action) {
            action.type.should.equal('APOLLO_PASSPORT_UPDATE');
            action.state.should.equal(nextState);
            done();
          }
        };

        middleware(store);
        ap.setState(nextState);
      });

    });

  });

});
