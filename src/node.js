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

// @flow

import Bindable, { BindableHandle, Chainable } from "./index";

type Primitive = string | number | boolean;

function isPrimitive(value: any) {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

interface INode {
  get(): any;
  set(newValue: any): void;
  mark(name: string, value: any, deep: boolean): void;
  unmark(name: string, deep: boolean): void;
}

export class BindableMetadata {
  observers: Set<BindableHandle> = new Set();
  parentNode: ?BaseNode;
  readOnly: boolean = false;
  extras: Map<string, any> = new Map();
}

export class BaseNode implements INode {
  _bindMetadata: BindableMetadata = new BindableMetadata();

  constructor(parentNode: ?BaseNode) {
    this._bindMetadata.parentNode = parentNode;
  }

  get() {
    throw("Not implemented");
  }

  set(newValue: any) {
    throw("Not implemented");
  }

  mark(name: string, value: any, deep: boolean) {
    if (name === 'readonly') {
      this._bindMetadata.readOnly = value;
    } else {
      this._bindMetadata.extras.set(name, value);
    }

    Bindable._nodeChanged(this, true);
  }

  unmark(name: string, deep: boolean) {
    if (name === 'readonly') {
      this._bindMetadata.readOnly = false;
    } else {
      this._bindMetadata.extras.delete(name);
    }

    Bindable._nodeChanged(this, true);
  }
}

export class PrimitiveNode extends BaseNode {
  _value: ?Primitive = null;

  constructor(data: Primitive, parentNode: ?BaseNode) {
    super(parentNode);

    this._value = data;
  }

  get() {
    return this._value;
  }

  set(newValue: any) {
    if (!isPrimitive(newValue)) {
      throw new TypeError(`Expected a primitive value but got ${typeof newValue}`);
    }

    if (this._bindMetadata.readOnly) {
      throw new Error('Cannot call set on a readonly node');
    }

    if (this._value === newValue) {
      return;
    }

    this._value = newValue;

    Bindable._nodeChanged(this, false);
  }
}

export class MapNode extends BaseNode {
  _map: Map<string, BaseNode> = new Map();

  constructor(data: Object, parentNode: ?BaseNode) {
    super(parentNode);

    for (const key in data) {
      this._map.set(key, Bindable._import(data[key], this));

      Object.defineProperty(this, key, {
        get() {
          return this._map.get(key);
        },

        set(newValue: any) {
          this._map.get(key).set(newValue);
        }
      });
    }
  }

  set(newValue: any) {
    // need some sort of merge
    throw("Needs to be implemented");
  }

  mark(name: string, value: any, deep: boolean) {
    super.mark(...arguments);

    if (deep) {
      this._map.forEach((item) => {
        item.mark(name, value, deep);
      });
    }
  }

  unmark(name: string, deep: boolean) {
    super.unmark(...arguments);

    if (deep) {
      this._map.forEach((item) => {
        item.unmark(name, deep);
      });
    }
  }
}

export class SetNode extends BaseNode {
  _data: Array<BaseNode> = [];

  constructor(data: Array<any>, parentNode: ?BaseNode) {
    super(parentNode);

    data.forEach((item, index) => {
      this._data.push(Bindable._import(item, this));

      Object.defineProperty(this, index, {
        get() {
          return this._data[index];
        },

        set(newValue: any) {
          this._data[index].set(newValue);
        }
      });
    });
  }

  mark(name: string, value: any, deep: boolean) {
    super.mark(...arguments);

    if (deep) {
      this._data.forEach((item) => {
        item.mark(name, value, deep);
      });
    }
  }

  unmark(name: string, deep: boolean) {
    super.unmark(...arguments);

    if (deep) {
      this._data.forEach((item) => {
        item.unmark(name, deep);
      });
    }
  }
}

export class ChainedMapNode extends BaseNode {
  _chained: Chainable<MapNode>;

  constructor(data: Chainable<MapNode>, parentNode: ?BaseNode) {
    super(parentNode);

    this._chained = data;

    data.data._map.forEach((value, key) => {
      Object.defineProperty(this, key, {
        get() {
          return this._chained.data._map.get(key);
        },

        set(newValue: any) {
          this._chained.data[key] = newValue;
        }
      });
    });

    Bindable.observe(this._chained.data, () => {
      Bindable._nodeChanged(this, false);
    });
  }
}
