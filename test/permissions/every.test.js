
const assert = require('chai').assert;
const feathers = require('feathers');
const memory = require('feathers-memory');
const feathersHooks = require('feathers-hooks');
const hooks = require('../../src/services');
const permissions = require('../../src/permissions');

describe('permissions every', () => {
  let app;

  beforeEach(() => {
    app = feathers()
      .configure(feathersHooks())
      .use('/users', memory());
  });

  describe('when all hooks are truthy', () => {
    beforeEach(() => {
      app.service('users').hooks({
        before: {
          all: [
            hooks.iff(
              permissions.every(
                (hook) => true,
                (hook) => 1,
                (hook) => {},
                (hook) => Promise.resolve(true)
              ),
              (hook) => Promise.resolve(hook)
            )
          ]
        }
      });
    });

    it('returns true', () => {
      return app.service('users').find().then(result => {
        assert.deepEqual(result, []);
      });
    });
  });

  describe('when a hook throws an error', () => {
    beforeEach(() => {
      app.service('users').hooks({
        before: {
          all: [
            hooks.iff(
              permissions.every(
                (hook) => true,
                (hook) => {
                  throw new Error('Hook 2 errored');
                },
                (hook) => true
              ),
              (hook) => Promise.resolve(hook)
            )
          ]
        }
      });
    });

    it('rejects with the error', () => {
      return app.service('users').find().catch(error => {
        assert.equal(error.message, 'Hook 2 errored');
      });
    });
  });

  describe('when a hook rejects with an error', () => {
    beforeEach(() => {
      app.service('users').hooks({
        before: {
          all: [
            hooks.iff(
              permissions.every(
                (hook) => true,
                (hook) => Promise.reject(Error('Hook 2 errored')),
                (hook) => true
              ),
              (hook) => Promise.resolve(hook)
            )
          ]
        }
      });
    });

    it('rejects with the error', () => {
      return app.service('users').find().catch(error => {
        assert.equal(error.message, 'Hook 2 errored');
      });
    });
  });

  describe('when at least one hook is falsey', () => {
    beforeEach(() => {
      app.service('users').hooks({
        before: {
          all: [
            hooks.iff(
              permissions.isNot(
                permissions.every(
                  (hook) => true,
                  (hook) => Promise.resolve(true),
                  (hook) => Promise.resolve(false),
                  (hook) => false,
                  (hook) => 0,
                  (hook) => null,
                  (hook) => undefined,
                  (hook) => true
                )
              ),
              () => Promise.reject(new Error('A hook returned false'))
            )
          ]
        }
      });
    });

    it('returns false', () => {
      return app.service('users').find().catch(error => {
        assert.equal(error.message, 'A hook returned false');
      });
    });
  });
});
