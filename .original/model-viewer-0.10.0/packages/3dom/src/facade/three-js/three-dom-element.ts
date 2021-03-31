/* @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Material, Object3D} from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';

import {SerializedThreeDOMElement} from '../../protocol.js';
import {getLocallyUniqueId} from '../../utilities.js';
import {ThreeDOMElement as ThreeDOMElementInterface} from '../api.js';

import {ModelGraft} from './model-graft.js';

export const $relatedObject = Symbol('relatedObject');
export const $type = Symbol('type');

const $graft = Symbol('graft');
const $id = Symbol('id');

/**
 * A SerializableThreeDOMElement is the common primitive of all scene graph
 * elements that have been facaded in the host execution context. It adds
 * a common interface to these elements in support of convenient
 * serializability.
 */
export class ThreeDOMElement implements ThreeDOMElementInterface {
  private[$graft]: ModelGraft;
  private[$relatedObject]: Object3D|Material|GLTF;

  private[$id]: number = getLocallyUniqueId();

  constructor(graft: ModelGraft, relatedObject: Object3D|Material|GLTF) {
    this[$relatedObject] = relatedObject;
    this[$graft] = graft;

    graft.adopt(this);
  }

  /**
   * The Model of provenance for this scene graph element.
   */
  get ownerModel() {
    return this[$graft].model;
  }

  /**
   * The unique ID that marks this element. In generally, an ID should only be
   * considered unique to the element in the context of its scene graph. These
   * IDs are not guaranteed to be stable across script executions.
   */
  get internalID() {
    return this[$id];
  }

  /**
   * Some (but not all) scene graph elements may have an optional name. The
   * Object3D.prototype.name property is sometimes auto-generated by Three.js.
   * We only want to expose a name that is set in the source glTF, so Three.js
   * generated names are ignored.
   */
  get name() {
    const relatedObject = this[$relatedObject];

    // NOTE: Some Three.js object names are modified from the names found in the
    // glTF. Special casing is handled here, but might be better moved to
    // subclasses down the road:
    if ((relatedObject as Material).isMaterial) {
      // Material names can be safely referenced directly from the Three.js
      // object.
      // @see: https://github.com/mrdoob/three.js/blob/790811db742ea9d7c54fe28f83865d7576f14134/examples/js/loaders/GLTFLoader.js#L2162
      return (relatedObject as Material).name;
    }

    return null;
  }

  /**
   * The backing Three.js scene graph construct for this element.
   */
  get relatedObject() {
    return this[$relatedObject];
  }

  toJSON(): SerializedThreeDOMElement {
    const serialized: SerializedThreeDOMElement = {id: this[$id]};
    const {name} = this;
    if (name != null) {
      serialized.name = name;
    }
    return serialized;
  }
}