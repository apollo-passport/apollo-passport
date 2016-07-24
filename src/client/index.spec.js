import ApolloPassport from './index';
import chai from 'chai';
import 'regenerator-runtime/runtime';

global.window = global;
const localStorage = window.localStorage = {
  items: {},
  getItem: (name) => localStorage.items[name],
  setItem: (name, value) => localStorage.items[name] = value,
  removeItem: (name) => delete localStorage.items[name]
};

const should = chai.should();

describe('ApolloPassport - client', () => {

  describe('- constructor', () => {

    it('instantiates correctly', () => {
      const apolloClient = {};
      const ap = new ApolloPassport({ apolloClient });

      ap.apolloClient.should.equal(apolloClient);
    });

    it('runs assertToken if a token exists in localStorage', (done) => {
      localStorage.setItem('apToken', 'a');
      const ap = new ApolloPassport({});
      ap.assertToken = function() {
        ap._token.should.equal('a');
        done();
      };
    });

  });

  describe('- actions -', () => {

    describe('loginWithEmail()', () => {

      it('handles errors', (done) => {
        const apolloClient = {
          mutate() {
            return new Promise(resolve => {
              resolve({
                errors: [
                  {
                    // think this is right, double check TODO
                    location: '',
                    message: 'an error'
                  }
                ]
              });
            });
          }
        };

        const ap = new ApolloPassport({ apolloClient });
        ap.loginWithEmail('a', 'b').then(() => {
          // Nothing to test for for now.
          done();
        });
      });

      it('sets state', (done) => {
        const apolloClient = {
          mutate() {
            return new Promise(resolve => {
              resolve({
                data: {
                  passportLoginEmail: {
                    userId: 'a'
                  }
                }
              });
            });
          }
        };

        const ap = new ApolloPassport({ apolloClient });
        ap.loginWithEmail('a', 'b').then(() => {
          ap.getState().should.deep.equal({
            userId: 'a',
            verified: true,
            error: null
          });
          done();
        });

      });

    });

    it('userId()', () => {
      const ap = new ApolloPassport({});
      ap.setState({ userId: 'a', verified: true, error: null });
      ap.userId().should.equal('a');
    });

    it('logout() clears state & local storage', () => {
      const ap = new ApolloPassport({});

      localStorage.setItem('apToken', 'a');
      localStorage.setItem('apUserId', 'b');
      ap.setState({ userId: 'b', verified: true, error: null });

      ap.logout();

      const state = ap.getState();
      state.userId.should.equal('');
      state.verified.should.be.false;
    });

  });

  describe('- state', () => {

    it('allows removal subscribers', () => {
      const ap = new ApolloPassport({});
      const test = function() {};

      ap.subscribe(test);
      ap.unsubscribe(test);
      ap._subscribers.has(test).should.be.false;
    });

    // subscribe+emitState tested in redux suite below.
  });

  describe('- optional redux support', () => {

    describe('- reducer', () => {

      const ap = new ApolloPassport({});
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

        const ap = new ApolloPassport({});
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

        const ap = new ApolloPassport({});
        const middleware = ap.middleware();
        const nextState = { userId: 'a', verified: true, error: null };
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