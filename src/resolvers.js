import passport from 'passport';

const resolvers = {

  RootMutation: {
    passportLoginEmail(root, args) {
      return new Promise((resolve, reject) => {

        passport.authenticate('local', (err, user, info) => {

          if (err)
            return reject(err);

          if (!user || info)
            return resolve({ error: info, token: "" });

          resolve({ error: "", token: this.createTokenFromUser(user) });

        })({ query: args }); // fake req.query using args from graphQL

      });
    }
  }

};

export default resolvers;