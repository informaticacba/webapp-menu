import Animation from './Animation';
import Position from './Position';
import Item from './Item';
import {addEventFunctions, addEventMember } from './Events';
import {nextId} from './Id';
import ItemCollection from './ItemCollection';
import TabList from './TabList';
import Attributes from './Attributes';

import {ReusableStyleSheet} from './Style';
import style from '../style/menu.scss';


class CloseTriggerFlags {
    constructor(parent) {
        this._parent = parent;
        this._escape = this._lostFocus = this._itemActivate = true;
    }

    get escape() {return this._escape}
    set escape(value) {this._escape = value; this.updateAttribute()}

    get lostFocus() {return this._lostFocus}
    set lostFocus(value) {this._lostFocus = value; this.updateAttribute()}

    get itemActivate() {return this._itemActivate}
    set itemActivate(value) {this._itemActivate = value; this.updateAttribute()}

    all() {this._escape = this._lostFocus = this._itemActivate = true;}
    none() {this._escape = this._lostFocus = this._itemActivate = false;}

    updateAttribute() {
        const str = this.toString();
        this._parent.setAttribute('closeon', str);    
    }

    updateInternal() {
        this.fromString(this._parent.getAttribute('closeon'));
    }

    fromString(str) {
        if( ! str) {
            this._escape = true;
            this._lostFocus = true;
            this._itemActivate = true;
        }

        const array = str.toLowerCase().split(',').map(s=>s.trim());
        if(0 == array.length || (1 == array.length && 'none' == array[0])) {
            this._escape = false;
            this._lostFocus = false;
            this._itemActivate = false;
        } else if ( 1 == array.length && 'all' == array[0]) {
            this._escape = true;
            this._lostFocus = true;
            this._itemActivate = true;
        } else {
            this._escape =  !! array.find(s=>s=='escape');
            this._lostFocus = !! array.find(s=>s=='lostfocus');
            this._itemActivate = !! array.find(s=>s=='itemactivate');
        }
    }

    toString() {
        const values = []
        if(this.escape)
            values.push('escape');

        if(this.lostFocus)
            values.push('lostfocus');

        if(this.itemActivate)
           values.push('itemactivate')

        if(3 == values.length)
            return 'all';
        if(0 == values.length)
            return 'none';

        return values.join(',');
    }
}

/**
 * Base class for list of items that are menus. Ie. that use arrow keys to move between a list of items
 */
class Menu extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({mode: 'open'});
        Menu.stylesheet.addToShadow(shadow);
        const outer = document.createElement('div');
        outer.style.display='none';
        outer.className = 'menu menu-outer menu-background';
        outer.setAttribute('role', 'menu');
        const inner = document.createElement('div');
        inner.className = 'menu-inner';
        const slot = document.createElement('slot');
        inner.appendChild(slot);
        outer.appendChild(inner);
        shadow.appendChild(outer);

        shadow.querySelector('slot').addEventListener('slotchange', this.updateAllItems.bind(this));

        /**
         * Caller editable list of items. 
         * 
         * Subclasses may add or filter items with the Menu#displayItems and Menu#interativeItems properies.
         * @see Menu#interactiveItems
         * @property {ItemCollection} items 
         */
        this.items = new ItemCollection(this);

        /** 
         * Events that will cause the menu to close
         * @property {CloseTriggerFlags} closeOn
         */
        Object.defineProperty(this, 'closeOn', {value:new CloseTriggerFlags(this)});

        /*this.element = document.createElement('div');
        this.element.className = 'menu';
        this.element['data-menu'] = this;*/
        this.addEventListener('keydown', Menu.onKeyDown);
        this.addEventListener('click', Menu.onClick);
        addEventMember(this);

        this._state = this._previousState = 'closed';
        this._controlledBy = {};
        this._position = Position.None;


        this.addEventListener('focusout', this.onFocusOut.bind(this));
    }

    /** 
     * Items that can be cycled through using the arrow keys.
     * 
     * Subclasses may use this to remove non-tabbable items (eg. seperators).  Typically
     * a subset of Menu#displayedItems
     * 
     * @see Menu#items
     * @see Menu#displayedItems
     * @property {TabList} interactiveItems
     */
    get interactiveItems() {return this.displayItems;}

    /**
     * Items that are visible to the user. 
     * 
     * Subclasses may use this to add items like seperators or default options.
     * 
     * @see Menu#items
     * @see Menu#displayedItems
     */
    get displayItems() {return new TabList(this.items);}

    /** @property {boolean} useAnimation */
    get useAnimation() {return Attributes.getTrueFalse(this, 'useanimation', true)}
    set useAnimation(value) {Attributes.setTrueFalse(this, 'useanimation', value)}

    /** @property {boolean} autoClose */
    //get autoClose() {return Attributes.getTrueFalse(this, 'autoclose', true)}
    //set autoClose(value) {Attributes.setTrueFalse(this, 'autoclose', value)}

    /**
     * @property {boolean} isOpen
     */
    get isOpen() {return Attributes.getExists(this, 'open')};
    set isOpen(value) {Attributes.setExists(this, 'open', value)}
    
    /**
     * @property {HTMLElement} controlledBy Element that controls this this menu.
     */
    get controlledBy () {
        const id = this.getAttribute('controlledBy');
        if( ! id)
            return null;
        return document.getElementById(id);
    }
    set controlledBy(value) {
        if( ! value)
            Attributes.setString(this, 'controlledby', null)
        else {
            if( ! value.id)
                value.id = nextId();
            this.setAttribute('controlledBy', value.id);
        }
    }


    /** @property {iconFactoryFunction} iconFactory */
    get iconFactory() {return this._iconFactory}
    set iconFactory(value) {
        this._iconFactory = value;
        for(let item of this.items)
            item.updateFactoryIcon();
    }


    static get observedAttributes() {
        return ['open', 'closeon', 'controlledby'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {

            case 'open':
                if(null != newValue && 'false' != newValue)
                    this.open();
                else
                    this.close();
                break;

            case 'controlledby':
                this.setControlledByElement(document.getElementById(newValue));
                break;

            case 'closeon':
                this.closeOn.updateInternal();    
        }
    }

    /**
     * @param {HTMLElement} element
     * @return {Menu} Get the Menu object that this element is contained in
     */
    static fromElement(element) {
        while(element &&  ! (element instanceof Menu)) {
            element = element.parentElement;
        }
        return element;
    }

    onFocusOut() {
        window.requestAnimationFrame(()=>{
            if( ! this.closeOn.lostFocus || 'open' != this.state) {
                return;
            }

            let focused = document.activeElement;
            while(focused) {
                if(focused === this)
                    return;
                focused = focused.parentElement
            }

            this.close();
        })
    }

    /**
     * If the menu is opened, closed, or in transition.  Public callers use isOpen
     * @property {string} state;
     * @private
     */
    get state() {return this._state;}
    set state(value) {
        this._state = value;
        
        this.isOpen = 'open' == value || 'opening' == value;
        if(this.controlledBy)
            this.controlledBy.setAttribute('aria-expanded', this.isOpen)
    }

    startTransition(transition) {
        //if(this.useAnimation)
        //    transition.play();
        //else
            transition.fastForward();
        return transition;
    }

    handleWindowResized() {
        // TODO
        //this.position.apply(this.element, this.host);
    }


    /**
     * @param {Boolean} [suppressFocus] if true, do not set the focus when the menu opens.  Useful for when
     *                     the menu is triggered via a pointer event instead of a keyboard event
     * @return {Transition} null if the menu is already open.  Otherwise a Transition.
     */
    open(suppressFocus=false) {
        if('open' == this.state|| 'opening' == this.state)
            return null;

        const event = new CustomEvent('wam-open', {
            bubbles:true,
            cancelable:false,
            detail: {
                menu: this,
            }
        });


        this.dispatchEvent(event);

        this.previousFocus = this.parentElement ? document.activeElement : null;
        this.state = 'opening';

        const menuElement = this.shadowRoot.querySelector('.menu');
        menuElement.style.display = '';
        

        let anim = new Animation.Transition(menuElement, 'menushow');
        anim.on('firstframe', (e)=>{
            if('opening' !== this.state) {
                e.transition.stop();
                return;
            }
            menuElement.style.display = '';
            
            this.position.apply(this);
        });
        anim.on('complete',()=>{
            this.state = 'open';
            if( ! suppressFocus)
                this.setFocusOn(this.focusItem);
            this.events.emit('opened', {menu:this});
            this.windowResizeFunc = ()=>this.handleWindowResized();
            window.addEventListener('resize',this.windowResizeFunc);
        })

        return this.startTransition(anim);
    }

    /**
     * @return {Transition} Null if it is already closed
     */
    close() {
        if(this.state == 'closed' || this.state == 'closing')
            return null;

        this.state = 'closing';

        let anim = new Animation.Transition(this.shadowRoot.querySelector('.menu'), 'menuhide');
        anim.on('firstframe',(e)=>{
            if(this.state !== 'closing') {
                e.transition.stop();
                return;
            }
            
            window.removeEventListener('resize', this.windowResizeFunc);
            this.windowResizeFunc = null;
        });
        anim.on('complete', ()=>{
            if(this.state != 'closing')
                return;

            this.state = 'closed';
            this.shadowRoot.querySelector('.menu').style.display = 'none';

            if(this.previousFocus && ( ! document.activeElement || document.activeElement === document.body))
                this.previousFocus.focus();
            
            this.previousFocus = null;
            this.setFocusOn(null);
            this.events.emit('closed', {menu:this});
        });

        return this.startTransition(anim);
    }


    /**
     * @return {HTMLElement|null} focused item in this menu or null if the focus is outside of this parent
     */
    getFocused() {
        const focused = document.activeElement;
        const menu = Menu.fromElement(focused);
        if(menu != this)
            return null;
        
        return focused;
    }

    
    /**
     * @property {Item} focusItem 
     */
    set focusItem(item) {
        for(let element of this.interactiveItems) {
            element.isDefaultFocus = (item == element);
        }
    }
    get focusItem() {
        const items = this.interactiveItems;
        return items.defaultFocusItem || items.first;
    }

    /**
     * Set the focused element of the current list.  Modifies tab index of items so
     * only the focused element has tabindex=0.  Others have tabindex=-1
     * @param {HTMLElement} item
     */
    setFocusOn(item) {
        this.focusItem = item;
        if(item)
            item.focus();
    }

    static onClick(e) {
        let menu = Menu.fromElement(e.currentTarget);
        if(menu)
            menu.onClick(e);
    }

    onClick(e) {
        const item = Item.fromEvent(e);
        if(item)
            this.activate(item, e);
    }

    static onKeyDown(e) {
        let menu = Menu.fromElement(e.currentTarget);
        if(menu)
            menu.onKeyPress(e);
    }

    /**
     * 
     */
    onKeyPress(e) {
        let item = this.getFocused();
        if( ! item)
            return;
    
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                this.setFocusOn(this.interactiveItems.previous(item));
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                this.setFocusOn(this.interactiveItems.next(item));
                e.preventDefault();
                break;
            case 'Escape':
                if(this.closeOn.escape)
                    this.close();
                break;
            case ' ':
            case 'Enter':
                this.activate(Item.fromEvent(e), e);
                e.preventDefault();
        }
    }

    /**
     * @param {Item} item
     */
    activate(item, initiatingEvent) {
        if(item.disabled)
            return;

        const event = new CustomEvent('wam-activate', {
            bubbles:true,
            detail: {
                item: item,
                menu: this,
                source:initiatingEvent
            }
        });

        if('function' == typeof item.action)
            item.action(event);

        const closeMenu = item.dispatchEvent(event);
        
        if(this.closeOn.itemActivate && closeMenu)
            this.close();    
    }

    /**
     * @type {Position} position
     */
    get position() {return this._position;}
    set position(value) { this._position = Position.from(value);}

    /** @private */
    releaseControlledByElement() {
        const controlledBy = this.controlledBy;
        if( ! controlledBy)
            return;

        const handlers = this.controlledByEventListeners;
        controlledBy.removeAttribute('aria-haspopup');
        controlledBy.removeAttribute('aria-expanded');
        controlledBy.removeAttribute('aria-controls');
        controlledBy.removeEventListener('click', handlers.onClick);
        controlledBy.removeEventListener('keydown', handlers.onKeyDown);

    }

    /** @private  */
    get controlledByEventListeners() {
        if( ! this._controlledByEventListeners) {
            this._controlledByEventListeners = {
                onClick: (e)=>{this.isOpen = ! this.isOpen},
                onKeyDown: (e)=>{
                    if(e.key == 'ArrowDown' &&  ! this.isOpen) {
                        this.focusItem = this.interactiveItems.first;
                        this.open();
                    } else if(e.key == 'ArrowUp' && ! this.isOpen) {
                        this.focusItem = this.interactiveItems.last;
                        this.open();
                    }
                }
            };
        }   
        return this._controlledByEventListeners;
    }

    /** @private */
    setControlledByElement(element) {
        this.releaseControlledByElement();

        if( ! this.id)
            this.id = nextId();

        const listeners = this.controlledByEventListeners;

        element.setAttribute('aria-haspopup', 'true');
        element.setAttribute('aria-expanded', this.isOpen);
        element.setAttribute('aria-controls', this.id);
        element.addEventListener('click', listeners.onClick);
        element.addEventListener('keydown', listeners.onKeyDown);


        this.position = Position.WithElement(element);
    }

    /**
     * @param {Item} item
     * @param {number} index
     * @param {Array<Items>} items
     */
    updateItem(item, index, items) {}

    /**
     * 
     */
    updateAllItems() {
        const items = Array.from(this.items);
        items.forEach(this.updateItem, this);
    }
}

addEventFunctions(Menu.prototype);

/** 
 * Set this as a fallback for any newly created Menu objects to use as the icon factory
 */
Menu.defaultIconFactory = null;

Object.defineProperty(Menu, 'stylesheet', {value: new ReusableStyleSheet(style)})

export default Menu;

