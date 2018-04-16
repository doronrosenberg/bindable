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

import { BaseNode } from "./node";

const TICK_DURATION = 50;

export class DeferredNodeChange {
  node: BaseNode;
  skipPropagation: boolean;

  constructor(node: BaseNode, skipPropagation: boolean) {
    this.node = node;
    this.skipPropagation = skipPropagation;
  }
}

/**
 * The notification controller (better name?) handles notifying observers on bindable nodes.
 *
 * Change notifications per root node are batched and delayed (at most) by TICK_DURATION.  If a root node already has a delayed
 * change then we append any new changes to the existing delay tick.
 */
export class NotificationController {
  queue: WeakMap<BaseNode, Array<DeferredNodeChange>> = new WeakMap();
  ticks: WeakMap<BaseNode, TimeoutID> = new WeakMap();
  markedNodes: WeakSet<BaseNode> = new WeakSet();

  nodeChanged(node: BaseNode, skipPropagation: boolean = false) {
    // get the root
    let root: BaseNode = node;
    while (root._bindMetadata.parentNode) {
      root = root._bindMetadata.parentNode;
    }

    if (!this.queue.has(root)) {
      this.queue.set(root, []);
    }

    const changes = this.queue.get(root);

    // add the new changed node into the right bucket based on the root node if the changed node doesn't
    // already exist in our list
    if (changes && !changes.some((item) => {
        return item.node === node;
      })) {
      changes.push(new DeferredNodeChange(node, skipPropagation));
    }

    if (!this.ticks.has(root)) {
      const tick = setTimeout(() => {
        this.processQueue(root);
      }, TICK_DURATION);

      this.ticks.set(root, tick);
    }
  }

  processQueue(root: BaseNode) {
    // TODO: some sort of mark and execute and a depth first execution to make sure we go leafs to root.

    // always clear the tick for this root
    this.ticks.delete(root);

    if (this.queue.has(root)) {
      const changedNodes = this.queue.get(root);

      // cache for all processed nodes to avoid multiple
      this.markedNodes = new WeakSet();

      changedNodes && changedNodes.forEach((item) => {
        this.fireChange(item.node, item.skipPropagation);
      });

      this.queue.delete(root);
    }
  }

  fireChange(node: BaseNode, skipPropagation: boolean = false) {
    if (this.markedNodes.has(node)) {
      return;
    }

    this.markedNodes.add(node);

    // TODO: current chain is leaf -> root, is this the best way?
    node._bindMetadata.observers.forEach((handle) => {
      handle._callback();
    });

    if (!skipPropagation) {
      node._bindMetadata.parentNode && this.fireChange(node._bindMetadata.parentNode);
    }
  }
}
