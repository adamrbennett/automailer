const program = require('commander'),
      path = require('path'),
      newman = require('newman'),
      git = require('./lib/git'),
      config = require('./config');

let services;

// parse cli options
program
  .arguments('[services...]')
  .action((s, opts) => {
    services = s;
  })
  .parse(process.argv);

if (services) {
  // parse service names from the command line
  // into service objects from the config
  services = parseServices(services);
} else {
  // default to all services in the config
  services = config.services;
}

// inject local cloudwatch reporter
loadModule('newman-reporter-cloudwatch', './newman-reporter-cloudwatch.js');

for (let serviceName in services) {
  let service = services[serviceName];

  // pull latest changes on the repo
  // if we already have it, otherwise clone it
  git.sync(service)
    .then((service) => {
      return new Promise((resolve, reject) => {

        // load the collection and env files out of the repo
        let col = loadCollection(service)
        let env = loadEnvironment(service);
        
        // run newman tests
        newman.run({
          collection: col,
          environment: env,
          folder: service.folder,
          reporters: service.reporters || ['cli'], // default to cli reporter
          reporter: service.reporterOptions
        })
          .on('start', (err, args) => {
            if (err) {
              return reject(err);
            }
            console.log('running tests...');
          })
          .on('done', (err, summary) => {
            if (err || summary.error) {
              return reject(err || summary.error);
            }
            return resolve(summary);
          });
      });
    })
    .then((results) => {
      // maybe do something here in the future
    })
    .catch(console.error);
}

// converts an array of service names into an
// array of service objects defined in the config
function parseServices(services) {
  let s = {};
  services.forEach((service) => {
    s[service] = config.services[service];
  });
  return s;
}

// loads a postman collection file as an object
function loadCollection(service) {
  return require(path.join(service.repositoryDir, service.collection));
}

// load a postman environment file as an object
// and performs any overrides defined in the config
function loadEnvironment(service) {
  let env = require(path.join(service.repositoryDir, service.environment));
  if (!service.overrides || !service.overrides.environment) {
    return env;
  }

  // override env values as specified in the config
  for (let o in service.overrides.environment) {
    let val = env.values.find(v => v.key === o);
    if (val) {
      val.value = service.overrides.environment[o];
      console.log(`overriding ${o} to equal ${val.value}`);
    }
  }

  return env;
}

// loads a local file as a module by putting it
// in the module cache and monkey patching resolution
function loadModule(name, path) {
  require.cache[name] = {
    id: name,
    filename: name,
    loaded: true,
    exports: require(path)
  };
  
  var Module = require('module');
  var realResolve = Module._resolveFilename;
  Module._resolveFilename = function fakeResolve(request, parent) {
      if (request === name) {
          return name;
      }
      return realResolve(request, parent);
  };
}