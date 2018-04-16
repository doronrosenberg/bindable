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
import Bindable, { BindableHandle } from "../index";
import INode from "./INode";

export class BindableMetadata {
  observers: Set<BindableHandle> = new Set();
  parentNode: ?BaseNode;
  readOnly: boolean = false;
  extras: Map<string, any> = new Map();
}

export default class BaseNode implements INode {
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
