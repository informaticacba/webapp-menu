import {ItemBase} from './Item';
import {ReusableStyleSheet} from './Style';
import separatorStyle from '../style/separator.scss';

/**
 * Non-interactive separator to group different menu items
 * 
 * @element wam-separator
 */
export class Separator extends ItemBase {
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        Separator.stylesheet.addToShadow(shadow);
    }

    get isInteractive() {
        return false;
    }

    static get tagName() {return 'wam-separator'}
}

Object.defineProperty(Separator, 'stylesheet', {value: new ReusableStyleSheet(separatorStyle)})

export default Separator;