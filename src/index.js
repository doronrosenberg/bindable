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

/**
 *
 * Bindable
 *
 *
 * TODO:
 *   - setting complex types/arrays
 *
 * Notes:
 *   - this kinda re-implements ES6 Proxy, would using a polyfill for that work?
 *   - marking only informs the node and doesn't propogate the change event as markings can go deep.  Need to think more if that is the best solution.
 *   - deferred notifications are individually deferred per root node, is this the right way or do we just have one global tick?
 *   - deferring can go on indefinitely, should we flush at a certain # of ticks?
 *
 */

import { NotificationController } from './notification';
import { BaseNode, ChainedMapNode, MapNode, PrimitiveNode, SetNode } from "./node";

// re-export
export * from './node';

// singleton that handles notification bundling
const controller = new NotificationController();

export class BindableHandle {
  _node: BaseNode;
  _callback: Function;

  constructor(node: BaseNode, callback: Function) {
    this._node = node;
    this._callback = callback;
  }
}

export class Chainable<T: BaseNode> {
  _data: T;

  constructor(data: T) {
    this._data = data;
  }

  get data(): T {
    return this._data;
  }
}

export default class Bindable {
  static from(data: any): BaseNode {
    return Bindable._import(data);
  }

  static observe(node: BaseNode, callback: Function) {
    const handle = new BindableHandle(node, callback);
    node._bindMetadata.observers.add(handle);

    return handle;
  }

  static unobserve(handle: BindableHandle) {
    if (handle) {
      handle._node._bindMetadata.observers.delete(handle);
    }
  }

  static freeze(node: BaseNode) {
    node.mark('readonly', true, true);
  }

  static unfreeze(node: BaseNode) {
    node.unmark('readonly', true);
  }

  static isFrozen(node: BaseNode): boolean {
    return node._bindMetadata.readOnly;
  }

  static getMetadata(node: BaseNode) {
    return node._bindMetadata;
  }

  static mark(node: BaseNode, name: string, value: any, deep: boolean) {
    node.mark(name, value, deep);
  }

  static unmark(node: BaseNode, name: string, deep: boolean) {
    node.unmark(name, deep);
  }

  static getMark(node: BaseNode, name: string) {
    return Bindable.getMetadata(node).extras.get(name);
  }

  static _import(data: any, parent: ?BaseNode): BaseNode {
    if (Array.isArray(data)) {
      return new SetNode(data, parent);
    } else if (typeof data === 'object') {
      if (data instanceof Chainable) {
        return new ChainedMapNode(data, parent);
      } else {
        return new MapNode(data, parent);
      }
    } else if (['string', 'number', 'boolean'].includes(typeof data)) {
      return new PrimitiveNode(data, parent);
    } else {
      throw new TypeError('Can only handle array/object/string/number/boolean');
    }
  }

  static _nodeChanged(node: BaseNode, skipPropogation: boolean) {
    controller.nodeChanged(node, skipPropogation);
  }
}
