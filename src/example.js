import '../style/example.scss';
import Menu from './api.js';

function materialIcon(name) {
    const icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.innerHTML = name;
    return icon;
}

function run() {
    const container = document.createElement('main');
    const p = document.createElement('p');
    p.appendChild(document.createTextNode('Use this toolbar to trigger the menu'));
    container.appendChild(p);
    document.body.appendChild(container);

    const items = [
        {label:'Submenu', type:Menu.ItemType.Nested, action:showSubMenu},
        {label:'Action 1', label2:'Explanation of Action', icon:''},
        {label:'Action 2', icon:''},
        {label:'Action 3',}
    ];
    const menu = Menu.Popup.create(items);
    //menu.autoClose = false;
    //menu.useAnimation = false;
    document.body.appendChild(menu);
    
    const tools = [
        {label:'Add', icon:'add'},
        {label:'Upload', icon:'cloud_upload'},
        {label:'Delete', icon:'delete'},
        {label:'Show Popup Menu', icon:'menu', showToolbarLabel:true, action:(e)=>{
            const rect = e.detail.item.getBoundingClientRect();
            const top = rect.top + rect.height + 8;
            menu.position = Menu.Position.DockablePopup(rect.left, top);
            menu.open();
        }}
    ];
    
    const toolbar = document.createElement(Menu.Toolbar.tagName);
    toolbar.items.set(tools);
    toolbar.autoClose = false;
    toolbar.iconFactory =  materialIcon;

    const customIcon = Menu.Item.create({label:'Custom Icon Test'});
    customIcon.innerHTML = '<span slot="icon">&copy;</span>';
    toolbar.appendChild(customIcon)
    toolbar.appendChild(Menu.Item.create({label:'Test2 Label', label2:'sub label', icon:'add'}))

    container.appendChild(toolbar);

    /*const toolbar = new Menu.Toolbar(tools , {host:container, iconFactory:materialIcon});
    toolbar.element.id = 'toolbar';
    toolbar.autoClose = false;
    toolbar.useAnimation = false;

    container.appendChild(toolbar.element);*/

   // button.setAttribute('aria-haspopup','true'); // since this button spawns an ARIA menu, set aria-haspopup

}

function showSubMenu() {
    return [
        {label:'Sub menu action 1'},
        {label:'Sub menu action 2'},
        {label:'Sub menu action 3'},
        {label:'Sub menu action 4'},
        {label:'Sub menu action 5'},
        {label:'Sub menu action 6'},
    ]
}

if('loading' == document.readyState)
    window.addEventListener('DOMContentLoaded', run)
else
    run();