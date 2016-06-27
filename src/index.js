const strategies = new Map();

const ApolloPassport = {

  constructor() {

  },

  addStrategy(strategyName, options) {
    strategies.set(strategyName, options);
  },

  schema() {
    return require('./schema');
  },

  resolvers() {
    return require('./resolvers');
  }

};

return default ApolloPassport;