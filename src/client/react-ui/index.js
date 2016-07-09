import React, { Component, PropTypes } from 'react';

function bindValues(obj, that) {
  const out = {};
  for (const key in obj)
    out[key] = obj[key].bind(that);
  return out;
}

const LoginButtonsUI = ({ state, actions }) => (
  <div>
    <If condition={state.userId}>
      <div onClick={actions.logout}>
        Log Out from {state.userId}
      </div>
    <Else />
      <div onClick={actions.login}>
        Log In
      </div>
    </If>
  </div>
);

LoginButtonsUI.propTypes = {
  state: PropTypes.object,
  actions: PropTypes.object
};

const LoginButtonsNativeActions = {

  login() {
    this.apolloPassport.loginWithEmail('test@test.com', 'x');
  },

  logout() {
    this.apolloPassport.logout();
  }

};

class LoginButtonsNative extends Component {

  constructor({ apolloPassport }) {
    super();
    this.actions = bindValues(LoginButtonsNativeActions, this);
    this.apolloPassport = apolloPassport;

    this.apStateHandler = function apStateHandler(state) {
      this.setState(state);
    }.bind(this);

    this.state = apolloPassport.getState();
    apolloPassport.subscribe(this.apStateHandler);
  }

  componentWillUnmount() {
    this.apolloPassport.unsubscribe(this.apStateHandler);
  }

  render() {
    return (
      <LoginButtonsUI state={this.state} actions={this.actions} />
    );
  }

}

export { LoginButtonsNative };
