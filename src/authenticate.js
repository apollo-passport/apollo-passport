/*
 * Promise-based wrapper around passport.authenticate (allows for more
 * flexible usage and negates dependency on express)
 */

export default function apAuthenticate(strategy, query) {
  const self = this;

  return new Promise((resolve, reject) => {

    const authenticator = self._authenticators[strategy];
    if (!authenticator)
      return reject(new Error('no authenticator for strategy: ' + strategy));

    let logInCalled = false;
    const fakeReq = {
      query,
      logIn(user, options, callback) {
        logInCalled = { user, options };
        callback();
      }
    };

    const fakeRes = {
      headers: {},
//      setHeader(key, value) { this.headers[key] = value; console.log("setHeader", key, value); },
//      end(text) { console.log('end', text) },
//      redirect(where) { console.log('redirect', where); }
    };

    const fakeNext = function() {
      // Must get Apollo style errors/data property.
      const data = {
        type: 'loginComplete',
        key: 'oauth2'
      };

      // XXX can we get an error TO here?  and, errrors CURRENTLY NOT CAUGHT HERE
      if (0 /* server side error */) {
        /* istanbul ignore next */
        data.errors = []; // apollo style error TODO
      } else {
        if (logInCalled)
          data.data = { oauth2: {
            token: self.createTokenFromUser(logInCalled.user),
            error: ""
          } };
        else
          data.data = { oauth2: {
            token: "",
            error: "Authentication Failed"
          } };
      }

      resolve(data);
    };

    authenticator(fakeReq, fakeRes, fakeNext);
  });

}
