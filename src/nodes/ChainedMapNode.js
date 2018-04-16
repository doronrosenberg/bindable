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
import Bindable, { Chainable } from "../index";
import MapNode from "./MapNode";

export default class ChainedMapNode extends BaseNode {
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
