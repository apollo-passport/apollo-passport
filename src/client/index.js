import jwtDecode from 'jwt-decode';
import _ from 'lodash';

// TODO check and warn if regenerator-runtime not installed / present

let instance;

class ApolloPassport {

  constructor({ apolloClient }) {
    if (instance)
      throw new Error("An ApolloPassport instance already exists");

    // Should we expose this via a getInstance static method?
    instance = this;

    this.apolloClient = apolloClient;

    this._subscribers = new Set();
    this.strategies = {};

    // Redux support.  This gets set this apolloClient.middleware().
    this.store = null;

    this._token = localStorage.getItem('apToken');

    // Set initial values
    this.setState(true);

    if (this._token) {
      // constructor is a synchronous method, queue this for after.
      setTimeout(() => { this.assertToken() }, 1);
    }

    window.addEventListener("message", this.receiveMessage.bind(this), false);
  }

  assertToken() {

  }

  /* messages */

  receiveMessage(event) {
    if (event.origin !== window.location.origin ||
        typeof event.data !== 'string' ||
        event.data.substr(0, 15) !== 'apolloPassport ')
      return;

    const data = JSON.parse(event.data.substr(15));
    if (data.type === 'loginComplete') {
      this.loginComplete(data, data.key);
    } else {
      throw new Error("Unknown apolloPassport message: "
        + event.data.substr(15));
    }
  }

  /* modules */

  use(strategyName, Strategy) {
    this.strategies[strategyName] = new Strategy(this);
  }

  extendWith(obj) {
    _.extend(this, obj);
  }

  /* actions */

  loginStart() {

  }

  loginComplete(result, dataKey) {
    if (result.errors) {
      console.error("A server side error was thrown during the Apollo Passport GraphQL query:");
      console.error(result.errors);
      return;
      // should we still update state?
    }

    const queryResult = result.data[dataKey];
    const data = queryResult.token ? jwtDecode(queryResult.token) : {};

    localStorage.setItem('apToken', queryResult.token);
    this.setState({
      data: data,
      verified: !!queryResult.token,
      error: queryResult.error || null
    });
  }

  logout() {
    localStorage.removeItem('apToken');
    this.setState({ data: {}, verified: false, error: null });
  }

  /* state */

  stateHash(state) {
    return JSON.stringify(state || this._state);
  }

  setState(nextState) {
    if (!this._state) {
      this._state = {
        data: this._token ? jwtDecode(this._token) : {},
        verified: false,
        error: null
      };
      this._stateHash = this.stateHash();
    }

    // Just set initial values and exit, used in constructor
    if (nextState === true)
      return;

    const nextStateHash = this.stateHash(nextState);
    const hasChanged = this._stateHash !== nextStateHash;

    if (hasChanged) {
      this._state = nextState;
      this._stateHash = nextStateHash;

      // XXX todo debounce
      this.emitState();
    }

  }

  getState() {
    return this._state;
  }

  subscribe(callback) {
    this._subscribers.add(callback);
  }

  unsubscribe(callback) {
    this._subscribers.delete(callback);
  }

  emitState() {
    const state = this.getState();
    this._subscribers.forEach(callback => callback(state));
  }

  /* optional redux support */

  reducer() {
    var self = this;

    return function apolloPassportReducer(state, action) {
      if (action.type === 'APOLLO_PASSPORT_UPDATE')
        return action.state;

      // I guess this is anti-pattern in Redux but I like to populate the
      // initial value without a dispatch.
      return state || self.getState();
    }
  }

  middleware() {
    var self = this;
    return function apolloPassportMiddleware(store) {
      self.store = store;

      self.subscribe(state => {
        self.store.dispatch({
          type: 'APOLLO_PASSPORT_UPDATE',
          state: state
        });
      });

      // Don't do anything special, we just use middleware to get our store
      // with the same API as Apollo.
      return next => action => next(action);
    }
  }
}

export default ApolloPassport;
