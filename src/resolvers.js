const resolvers = {

  /**
   * Returns a list of available login services used for logging in (and
   * rendering) from the client.
   *
   * @return {Object[]} like this:
   *
   * ```js
   * [
   *   {
   *     name: 'facebook',
   *     label: 'Facebook',
   *     type: 'oauth',
   *     clientId: '403859966407266',
   *     scope: 'public_profile,email',
   *     iconUrl: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAq0lEQVQ4jWP8//8/AyWAhYGBgcEmauYZBgYGYxL1nj2yLN2ECcohVTNcDwsxKlXlhRm6yzwZRAS5GRgYGBhsombC5ZhwaUIGyJrRAVEuwGYzSS7AB/C64MiydKx8ZJfgNeDN+68MDAwIL8D4RLsgIHsJis0wPjKgOAyoE4hcnGwMGkpiBBUbacvA2TfuvaKiC759/3X23NUnOPMDtgTEwMBwloGBgYGR0uwMAGOPLJS9mkQHAAAAAElFTkSuQmCC)',
   *     urlStart: 'https://www.facebook.com/dialog/oauth?display=popup&'
   *   }
   * ]
   * ```
   */
  apDiscovery: {
    services(root) {
      const out = [];

      for (const key in root.self.strategies) {
        const service = root.self.strategies[key];
        if (service._oauth2) {
          out.push({
            name: service.name,
            // TODO, move as default to client
            label: service.name.charAt(0).toUpperCase() + service.name.substr(1),
            type: 'oauth',
            clientId: service._oauth2._clientId,
            scope: (service._scope && service._scope.join(',')) || "",
            urlStart: service._oauth2._authorizeUrl
          })
        }
      }

      return out;
    }
  },

  RootMutation: {},

  RootQuery: {

    apDiscovery() {
      return {
        ROOT_URL: this.ROOT_URL,
        authPath: this.authPath,
        self: this
      };
    }

  }
};

export default resolvers;
