import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function verify(username, password, done) {
  //return done(null, false);
  done(null, {
    username: 'gadi',
    password: 'pass'
  });
}));

const resolvers = {

  RootMutation: {
    passportLoginEmail(root, args) {
      return new Promise((resolve, reject) => {

        passport.authenticate('local', (err, user, info) => {
          console.log('callback', err, user, info);

          resolve({
            loginToken: null
          });
        })({ query: args });

      });
    }
  }

};

export default resolvers;