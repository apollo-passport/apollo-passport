const resolvers = {

  apDiscovery: {
    services(root) {
      const out = [];

      console.log('services', root.self.strategies);
      for (const key in root.self.strategies) {
        const service = root.self.strategies[key];
        if (service._oauth2) {
          out.push({
            name: service.name,
            label: service.name.charAt(0).toUpperCase() + service.name.substr(1),
            type: 'oauth',
            clientId: service._oauth2._clientId,
            scope: service._scope | "",
            urlStart: service._oauth2._authorizeUrl
          })
        }
      }
      console.log(out);
      return out;
      return [
        {
          name: 'facebook',
          label: 'Facebook',
          type: 'oauth',
          clientId: '403859966407266',
          scope: 'public_profile,email',
          iconUrl: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAq0lEQVQ4jWP8//8/AyWAhYGBgcEmauYZBgYGYxL1nj2yLN2ECcohVTNcDwsxKlXlhRm6yzwZRAS5GRgYGBhsombC5ZhwaUIGyJrRAVEuwGYzSS7AB/C64MiydKx8ZJfgNeDN+68MDAwIL8D4RLsgIHsJis0wPjKgOAyoE4hcnGwMGkpiBBUbacvA2TfuvaKiC759/3X23NUnOPMDtgTEwMBwloGBgYGR0uwMAGOPLJS9mkQHAAAAAElFTkSuQmCC)',
          urlStart: 'https://www.facebook.com/dialog/oauth?display=popup&'
        }
      ];
    }
  },

  RootMutation: {},

  RootQuery: {

    apDiscovery() {
      return {
        ROOT_URL: "http://localhost:3200/",
        authPath: 'ap-auth/',
        self: this
      };
    }

  }
};

export default resolvers;
