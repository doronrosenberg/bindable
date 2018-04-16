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

export default class SetNode extends BaseNode {
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
