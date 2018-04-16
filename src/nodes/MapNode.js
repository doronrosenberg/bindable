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
import BaseNode from "./BaseNode";
import Bindable from "../index";

export default class MapNode extends BaseNode {
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
