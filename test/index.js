/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const expect = require('chai').expect;
const { BindableHandle, Chainable } = require('../lib');
const Bindable = require('../lib').default;

describe('Bindable Tests', function() {
  describe('Base Tests', function() {
    it('Test getting of primitive values', function() {
      const bd = Bindable.from({
        name: 'foo',
        deep: {
          dive: 'water'
        },
        age: 14,
        valid: false
      });

      expect(bd.name.get()).to.equal('foo');
      expect(bd.deep.dive.get()).to.equal('water');
      expect(bd.valid.get()).to.equal(false);
      expect(bd.age.get()).to.equal(14);
    });

    it('Test setting of primitive values', function() {
      const bd = Bindable.from({
        name: 'foo',
        age: 14,
        valid: false
      });

      bd.name = 'bar';
      bd.age = 15;
      bd.valid = true;

      expect(bd.name.get()).to.equal('bar');
      expect(bd.age.get()).to.equal(15);
      expect(bd.valid.get()).to.equal(true);

      // test errors
      expect(() => {
        bd.name = {};
      }).to.throw(TypeError);

      expect(() => {
        bd.name = [];
      }).to.throw(TypeError);
    });

    it('Test getting of array values', function() {
      const bd = Bindable.from({
        name: [1,2,3,4]
      });

      expect(bd.name[2].get()).to.equal(3);
    });

    it('Test basic observing on primitive values', function() {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          name: 'foo',
          deep: {
            dive: 'water'
          }
        });

        const handle = Bindable.observe((bd.deep.dive), () => {
          expect(bd.deep.dive.get()).to.equal('fire');
          setTimeout(() => {resolve();}, 200);
        });
        expect(handle).to.be.an.instanceOf(BindableHandle);

        bd.deep.dive = 'fire';
      });
    });

    it('Test basic observing on map values', function() {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          name: 'foo',
          deep: {
            dive: 'water'
          }
        });

        let handler1 = false;
        let handler2 = false;

        function isDone() {
          if (handler1 && handler2) {
            setTimeout(() => {resolve();}, 200);
          }
        }

        Bindable.observe(bd.deep, () => {
          if (handler1) {
            reject('observe got called more than once');
            return;
          }

          expect(bd.deep.dive.get()).to.equal('fire');

          handler1 = true;
          isDone();
        });

        Bindable.observe(bd, () => {
          if (handler2) {
            reject('observe got called more than once');
            return;
          }

          expect(bd.deep.dive.get()).to.equal('fire');

          handler2 = true;
          isDone();
        });


        bd.deep.dive = 'fire';
      });
    });

    it('Test basic observing on array values', function() {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          values: [1,2,3,4]
        });

        let handler1 = false;
        let handler2 = false;

        function isDone() {
          if (handler1 && handler2) {
            setTimeout(() => {resolve();}, 200);
          }
        }

        Bindable.observe(bd.values, () => {
          if (handler1) {
            reject('observe got called more than once');
            return;
          }

          expect(bd.values[2].get()).to.equal(6);

          handler1 = true;
          isDone();
        });

        Bindable.observe(bd, () => {
          if (handler2) {
            reject('observe got called more than once');
            return;
          }

          expect(bd.values[2].get()).to.equal(6);

          handler2 = true;
          isDone();
        });


        bd.values[2] = 6;
      });
    });

    it('Test basic unobserving', function() {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          name: 'foo',
          deep: {
            dive: 'water'
          }
        });

        const handle = Bindable.observe((bd.deep.dive), () => {
          reject(new Error('handle fired even though we unobserved'));
        });
        expect(handle).to.be.an.instanceOf(BindableHandle);

        Bindable.unobserve(handle);
        bd.deep.dive = 'fire';
        setTimeout(() => {resolve();}, 200);
      });
    });

    it('Test freezing', () => {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          deep: {
            value: 'foo'
          }
        });

        Bindable.freeze(bd.deep);
        expect(Bindable.isFrozen(bd.deep)).to.be.true;

        expect(() => {
          bd.deep.value = 'bar';
        }).to.throw(Error);

        expect(bd.deep.value.get()).to.equal('foo');

        Bindable.unfreeze(bd.deep);

        bd.deep.value = 'bar';
        expect(bd.deep.value.get()).to.equal('bar');

        Bindable.freeze(bd.deep);
        Bindable.unfreeze(bd.deep.value);

        bd.deep.value = 'baz';
        expect(bd.deep.value.get()).to.equal('baz');

        setTimeout(() => {resolve();}, 200);
      });
    });

    it('Test marking', (done) => {
      const bd = Bindable.from({
        deep: {
          value: 'foo'
        }
      });

      Bindable.mark(bd.deep.value, 'valid', false);

      expect(Bindable.getMark(bd.deep.value, 'valid')).to.be.false;

      Bindable.unmark(bd.deep.value, 'valid');

      expect(Bindable.getMark(bd.deep.value, 'valid')).to.be.undefined;

      Bindable.observe((bd.deep.value), () => {
        done();
      });

      Bindable.mark(bd.deep.value, 'valid', true);
    });

    it('Test change batching', function() {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          name: 'foo',
          deep: {
            dive: 'water'
          }
        });

        let counter = 0;

        const handle = Bindable.observe((bd.deep.dive), () => {
          counter++;

          // we expect only one fire due to batching
          if (counter > 1) {
            reject('observe got called more than once');
            return;
          }

          expect(bd.deep.dive.get()).to.equal('fire');

          setTimeout(() => {
            resolve();
          }, 200);
        });
        expect(handle).to.be.an.instanceOf(BindableHandle);

        bd.deep.dive = 'fire2';
        bd.deep.dive = 'fire';
      });
    });

    it('Test change batching - avoid multiple change calls on parent nodes', function() {
      return new Promise((resolve, reject) => {
        const bd = Bindable.from({
          deep: {
            dive: 'water',
            dive2: 'water2'
          }
        });

        let counter = 0;

        const handle = Bindable.observe((bd.deep), () => {
          counter++;

          // we expect only one fire due to batching
          if (counter > 1) {
            reject(new Error('observe got called more than once'));
            return;
          }

          expect(bd.deep.dive.get()).to.equal('fire');
          expect(bd.deep.dive2.get()).to.equal('fire2');
          setTimeout(() => {
            resolve();
          }, 200);
        });
        expect(handle).to.be.an.instanceOf(BindableHandle);

        bd.deep.dive = 'fire2';
        bd.deep.dive = 'fire';
        bd.deep.dive2 = 'fire2';
      });
    });

    it('Test basic chaining', function() {
      return new Promise((resolve, reject) => {
        class ChainableTest extends Chainable {
          constructor() {
            super(Bindable.from({chain: 'linked'}));
          }
        }

        const bd = Bindable.from({
          deep: {
            dive: 'water',
            dive2: new ChainableTest()
          }
        });

        expect(bd.deep.dive2.chain.get()).to.equal('linked');

        let counter = 0;

        const handle = Bindable.observe(bd.deep, () => {
          counter++;

          // we expect only one fire due to batching
          if (counter > 1) {
            reject(new Error('observe got called more than once'));
            return;
          }

          expect(bd.deep.dive2.chain.get()).to.equal('broken');
          setTimeout(() => {
            resolve();
          }, 200);
        });

        bd.deep.dive2.chain = 'broken';
      });
    });

    it('Test complex chaining', function() {
      return new Promise((resolve, reject) => {
        class ChainableTest extends Chainable {
          constructor() {
            super(Bindable.from({chain: 'linked'}));
          }
        }

        const chained = new ChainableTest();

        const bd = Bindable.from({
          deep: {
            dive: chained,
            dive2: chained
          }
        });

        expect(bd.deep.dive.chain.get()).to.equal('linked');
        expect(bd.deep.dive2.chain.get()).to.equal('linked');

        let counter = 0;

        function handler() {
          counter++;

          // we expect only one hit due to batching
          if (counter > 3) {
            reject(new Error('observe got called more than once'));
            return;
          }

          expect(bd.deep.dive.chain.get()).to.equal('broken');
          expect(bd.deep.dive2.chain.get()).to.equal('broken');

          if (counter === 3) {
            setTimeout(() => {
              resolve();
            }, 200);
          }
        }

        Bindable.observe(bd.deep, handler);
        Bindable.observe(bd.deep.dive, handler);
        Bindable.observe(bd.deep.dive2, handler);

        bd.deep.dive2.chain = 'broken';
      });
    });
  });
});
