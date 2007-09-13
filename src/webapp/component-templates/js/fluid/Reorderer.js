/*
 Fluid Project

 Copyright (c) 2006, 2007 University of Toronto. All rights reserved.

 Licensed under the Educational Community License, Version 1.0 (the "License"); 
 you may not use this file except in compliance with the License. 
 You may obtain a copy of the License at 
 
 http://www.opensource.org/licenses/ecl1.php 
 
 Unless required by applicable law or agreed to in writing, software 
 distributed under the License is distributed on an "AS IS" BASIS, 
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 See the License for the specific language governing permissions and 
 limitations under the License.

 Adaptive Technology Resource Centre, University of Toronto
 130 St. George St., Toronto, Ontario, Canada
 Telephone: (416) 978-4360
*/

dojo.provide("fluid.Reorderer");

fluid.declare = function(target, args) {
	for (arg in args) {
    	target[arg] = args[arg];
    }
};

dojo.require("dijit._Widget");
dojo.require("dojo.dnd.source");
dojo.require("dijit.Tooltip");
dojo.require("fluid.Fluid");

(function() {
	fluid.states = {
		defaultClass:"image-container-default",
		selectedClass:"image-container-selected",
		draggingClass:"image-container-dragging"
	};
})();



dojo.declare(
	"fluid.Reorderer",	// class name
	dijit._Widget,
	{
		// the reorderable DOM element that is currently active
		activeItem: null,
		
		layoutHandler: null,
		
		messageNamebase: "message-bundle:",
		
		orderChangedCallback: null,
		
		/**
		 * Return the element within the item that should receive focus. This is determined by the class 
		 * 'reorderable-focus-target'. If it is not specified, the item itself is returned.
		 * 
		 * @param {Object} item
		 * @return {Object} The element that should receive focus in the specified item.
		 */
		getElementToFocus: function(item) {
			var elementToFocus = dojo.query(".reorderable-focus-target", item)[0];
			if (elementToFocus) {
				return elementToFocus;
			}
			
			return item;
		},

		// Dojo calls this function after constructing the object.
		postCreate: function () {			
			if (this.domNode) {
				this._setUpDomNode();
			}
			
			this._enableDragAndDrop();
		},
		
		_setUpDomNode: function () {
			// Connect the listeners that handle keypresses and focusing
			dojo.connect(this.domNode, "keypress", this, "handleArrowKeyPress");
			dojo.connect(this.domNode, "keydown", this, "handleKeyDown");
			dojo.connect(this.domNode, "keyup", this, "handleKeyUp");
			dojo.connect(this.domNode, "onfocus", this, "selectActiveItem");
			dojo.connect(this.domNode, "onblur", this, "changeActiveItemToDefaultState");

			this.layoutHandler.setReorderableContainer(this.domNode);

			if (this.domNode.getAttribute("aaa:activedescendent")) {
				this.domNode.removeAttribute("aaa:activedescendent");
			}
		},
		
		/**
		 * Changes the current focus to the specified item.
		 * @param {Object} anItem
		 */
		focusItem: function(anItem) {
			this.changeActiveItemToDefaultState();
			this._setActiveItem(anItem);			
			dojo.removeClass(this.activeItem, fluid.states.defaultClass);
			dojo.addClass(this.activeItem, fluid.states.selectedClass);
			this.getElementToFocus(this.activeItem).focus();
		},
		
		/**
		 * Changes focus to the active item.
		 */
		selectActiveItem: function() {
			if (!this.activeItem) {
				var orderables = dojo.query (".orderable", this.domNode);
				if (orderables.length > 0) {
					this._setActiveItem(orderables[0]);
				}
				else
					return;
			}
			this.focusItem(this.activeItem);
		},
		
		changeActiveItemToDefaultState: function() {
			if (this.activeItem) {
				dojo.removeClass(this.activeItem, fluid.states.selectedClass);
				dojo.addClass(this.activeItem, fluid.states.defaultClass);
			}
		},
		
		handleKeyDown: function (evt) {
			if (this.activeItem && evt.keyCode == dojo.keys.CTRL) {
				dojo.removeClass(this.activeItem, fluid.states.selectedClass);
				dojo.addClass(this.activeItem, fluid.states.draggingClass);
				dojo.stopEvent(evt);
			}
		},
		
		handleKeyUp: function (evt) {
			if (this.activeItem && evt.keyCode == dojo.keys.CTRL) {
				dojo.removeClass(this.activeItem, fluid.states.draggingClass);
				dojo.addClass(this.activeItem, fluid.states.selectedClass);
				dojo.stopEvent(evt);
			}		
		},
		
		handleArrowKeyPress: function (evt){
			if (this.activeItem) {
				switch (key = evt.keyCode) {
				case dojo.keys.DOWN_ARROW: {
					this.handleDownArrow(evt.ctrlKey);								
					dojo.stopEvent(evt);
					break;
				}
				case dojo.keys.UP_ARROW: {
					this.handleUpArrow(evt.ctrlKey);								
					dojo.stopEvent(evt);
					break;
				}
				case dojo.keys.LEFT_ARROW: {
					this.handleLeftArrow(evt.ctrlKey);								
					dojo.stopEvent(evt);
					break;
				}
				case dojo.keys.RIGHT_ARROW: {
					this.handleRightArrow(evt.ctrlKey);								
					dojo.stopEvent(evt);
					break;
				}
				default:
				}
			}
		},
	
		handleUpArrow: function (isCtrl) {
			if (isCtrl) {
 				this.layoutHandler.moveItemUp(this.activeItem);
				this.getElementToFocus(this.activeItem).focus();
				this.orderChangedCallback();
			} else {
				this.focusItem(this.layoutHandler.getItemAbove(this.activeItem));
			}			
		},

		handleDownArrow: function (isCtrl) {
			if (isCtrl) {
				this.layoutHandler.moveItemDown(this.activeItem);
				this.getElementToFocus(this.activeItem).focus();
				this.orderChangedCallback();
			} else {
				this.focusItem(this.layoutHandler.getItemBelow(this.activeItem));
			}
		},
		
		handleRightArrow: function(isCtrl) {
			if (isCtrl) {
				this.layoutHandler.moveItemRight(this.activeItem);
				this.getElementToFocus(this.activeItem).focus();
				this.orderChangedCallback();				
			} else {
				this.focusItem(this.layoutHandler.getRightSibling(this.activeItem));				
			}			
		},
		
		handleLeftArrow: function(isCtrl) {
			if (isCtrl) {
				this.layoutHandler.moveItemLeft(this.activeItem);
				this.getElementToFocus(this.activeItem).focus();
				this.orderChangedCallback();				
			} else {
				this.focusItem(this.layoutHandler.getLeftSibling(this.activeItem));				
			}
		},
				
		_fetchMessage: function(messagekey) {
			var messageID = this.messageNamebase + messagekey;
			var node = document.getElementById(messageID);
			
			return node? node.innerHTML: "[Message not found at id " + messageID + "]";
		},
		
		_setActiveItem: function(anItem) {
			this.activeItem = anItem;
			this._updateActiveDescendent();
		},
		
		_updateActiveDescendent: function() {
			if (this.activeItem) {
				this.domNode.setAttribute("aaa:activedescendent", this.activeItem.id);
			} else if (this.domNode.getAttribute("aaa:activedescendent")) {
				this.domNode.removeAttribute("aaa:activedescendent");
			}
		},

        _itemCreator: function(item, hint) {
        	var types = [];
        	return {node: item, data: item, types: types};
        },

		_enableDragAndDrop: function() {
			dndlb = new dojo.dnd.Source(this.domNode.id, {creator: this._itemCreator, horizontal: true});
			dndlb.reorderer = this;
			items = dojo.query(".orderable", this.domNode);
			var itemArray = new Array();
			for(i = 0; i < items.length; i++) {
				itemArray.push(items[i]);
			}
			dndlb.insertNodes(false, itemArray);
			
			// Override dojo's dnd 'onMouseDown' in order to put focus on the drag source.  Then
			// apply the superclass 'onMouseDown'.
            dndlb.onMouseDown = function(ecmaEvent){
				// note: source.target will not work in IE, need to use source.srcElement instead.
				var targetElement = (ecmaEvent.target || ecmaEvent.srcElement);
                this.reorderer.focusItem(this.reorderer._findReorderableParent(targetElement));
                dojo.dnd.Source.prototype.onMouseDown.apply(dndlb, arguments);
            };
			
			// dojo's dnd system lastly calls 'onDndCancel'. Override it here to first call the
			// superclass 'onDndCancel', and then set focus to the dropped item after superclass
			// returns.
			dndlb.onDndCancel = function () {
				dojo.dnd.Source.prototype.onDndCancel.apply (dndlb, arguments);
				this.reorderer.focusItem (this.reorderer.activeItem);
			};
			
			dndlb.onDndDrop = function(source, nodes, copy) {
				// Use of "this" here is alarmingly ambiguous, and we really want the
				// callback not to be a public property.
                dojo.dnd.Source.prototype.onDndDrop.call(this, source, nodes, copy);
		  	    this.reorderer.orderChangedCallback();
			}
		},

		/**
		 * Finds the parent element marked "orderable" for a child element.
		 */
		_findReorderableParent: function(childElement) {
			if (childElement == null) {
				return null;
			} else if (dojo.hasClass(childElement, "orderable")) {
				return childElement;
			} else {
				return this._findReorderableParent(childElement.parentNode);
			}
		}
	}
	
);
