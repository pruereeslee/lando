'use strict';

// Modules
const _ = require('lodash');

// Helper to builder nginx command
const nginxCommand = vhost => [
  '/bin/bash -c',
  '"mkdir -p /opt/bitnami/nginx/conf/vhosts',
  '&&',
  'render-template',
  `\"${vhost}\" > \"/opt/bitnami/nginx/conf/vhosts/lando.conf\"`,
  '&&',
  '/entrypoint.sh /run.sh"',
].join(' ');

// Helper to get long varnish command
const varnishCmd = [
  '/bin/sh -c',
  '"sed -i \\\"/  enabled: /c\  enabled: false,\\\" /etc/chaperone.d/chaperone.conf',
  '&&',
  '/usr/local/bin/chaperone --user root --force --debug"',
].join(' ');

// Helper to get varnsh ssl nginx
const varnishSsl = options => ({
  command: nginxCommand('/opt/bitnami/extra/nginx/templates/default.conf.tpl'),
  image: 'bitnami/nginx:1.14.2',
  depends_on: [options.name],
  environment: {
    NGINX_DAEMON_USER: 'root',
    NGINX_DAEMON_GROUP: 'root',
    LANDO_VARNISH_ALIAS: `${options.name}_varnish`,
  },
  user: 'root',
  volumes: [
    `${options.confDest}/${options.defaultFiles.ssl}:/opt/bitnami/extra/nginx/templates/default.conf.tpl`,
  ],
});

// Builder
module.exports = {
  name: 'varnish',
  config: {
    version: '4.1',
    supported: ['4.1'],
    backends: ['appserver'],
    confSrc: __dirname,
    backend_port: '80',
    ssl: false,
    sources: [],
    defaultFiles: {
      ssl: 'ssl-termination.conf.tpl',
    },
    remoteFiles: {
      vcl: '/etc/varnish/conf.d/lando.vcl',
    },
  },
  parent: '_lando',
  builder: (parent, config) => class LandoVarnish extends parent {
    constructor(id, options = {}, factory) {
      options = _.merge({}, config, options);
      // Arrayify the backend
      if (!_.isArray(options.backends)) options.backends = [options.backends];
      // Build the default stuff here
      const varnish = {
        image: `eeacms/varnish:${options.version}-3.0`,
        command: varnishCmd,
        depends_on: options.backends,
        environment: {
          BACKENDS: options.backends.join(' '),
          BACKENDS_PORT: options.backend_port,
          ADDRESS_PORT: ':80',
          BACKENDS_PROBE_ENABLED: 'false',
          LANDO_NO_USER_PERMS: 'NOTGONNADOIT',
        },
        networks: {default: {aliases: [`${options.name}_varnish`]}},
        ports: ['80'],
      };
      // Set some info about our backends
      options.info = {backends: options.backends};
      // Set the varnish
      options.sources.push({services: _.set({}, options.name, varnish)});
      // Spin up an nginx bomb as well
      if (options.ssl) {
        // Sort of copy our options
        const sslOpts = _.cloneDeep(options);
        sslOpts.name = `${options.name}_ssl`;
        // Set another lando service we can pass down the stream
        const LandoService = factory.get('_lando');
        const nginx = {services: _.set({}, sslOpts.name, varnishSsl(options))};
        options.sources.push(new LandoService(sslOpts.name, sslOpts, nginx).data);
        options.info.ssl_served_by = sslOpts.name;
      }
      // Set SSL false for downstream because we've already handled it above
      options.ssl = false;
      // Send it downstream
      super(id, options, ..._.flatten(options.sources));
    };
  },
};
