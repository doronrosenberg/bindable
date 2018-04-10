Bindable
========

Experimenting with creating a bindable model to make life easier when dealing with complex forms.

Allows:

  * Listening for change events anywhere in the model tree
  * Change events bubble up the parent tree
  * Freeze/unfreeze subtrees (readonly mode)
  * Ability to mark nodes with custom metadata (invalid, changed, etc)
  * One source of truth - changes are applied synchronously
  * Events are async and bundled to reduce change notification storms
  * Allow two way bindings because we are not babies

Planned:

  * Chaining multiple bindables, each with their own validation
  * Sync events


Examples
--------

Get notified when values change:

```js
  import Bindable from 'bindable';

  const model = Bindable.from({
    person: {
      name: 'foo'
    }
  });

  Bindable.observe(model.person.name, () => {
    console.log('name is', model.persoin.name.get());
  });

  model.person.name = 'bar';
  // name is bar
```

Listen for children change events:

```js
  import Bindable from 'bindable';

  const model = Bindable.from({
    person: {
      name: 'foo'
    }
  });

  Bindable.observe(model.person, () => {
    console.log('name is', model.person.name.get());
  });

  model.person.name = 'bar';
  // name is bar
```

Marking nodes with custom metadata:

```js
  import Bindable from 'bindable';

  const model = Bindable.from({
    person: {
      name: 'foo'
    }
  });

  Bindable.observe(model.person, () => {
    const isValid = model.person.name.get().length > 0;

    Bindable.mark(model.person, 'valid', isValid);

    console.log('is valid:', Bindable.getMark(model.person, 'valid');
  });

  model.person.name = '';
  // is valid: false

```

Events are bundled to minimize notification storms:

```js
  import Bindable from 'bindable';

  const model = Bindable.from({
    name: 'foo'
  });

  Bindable.observe(model.name, () => {
    console.log('name is', model.name.get());
  });

  model.name = 'bar';
  model.name = 'baz';
  // name is baz
```

You can freeze parts of the model:

```js
  import Bindable from 'bindable';

  const model = Bindable.from({
    person: {
      name: 'foo'
    }
  });

  Bindable.freeze(model.person);

  model.person.name = 'bar';
  // throws an Error

```
