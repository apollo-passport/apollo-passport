import passport from 'passport';

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