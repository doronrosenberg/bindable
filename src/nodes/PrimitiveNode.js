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
import Bindable from "../index";
import BaseNode from "./BaseNode";

type Primitive = string | number | boolean;

function isPrimitive(value: any) {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

export default class PrimitiveNode extends BaseNode {
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
