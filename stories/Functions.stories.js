import Menu from '../dist/webapp-menu';

export default {
    title: 'Functions'
 }

function materialIcon(name) {
    const icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.innerHTML = name;
    return icon;
}

function createPopup() {
    const popup = createStaticPopup();
    return popup;
}

function createStaticPopup() {
    const popup = document.createElement('wam-popup');
    popup.isPopup = false;
    popup.items.set([
        {label:'Cut'},
        {label:'Copy'},
        {label:'Paste'}
    ]);
    return popup;
}

export const ControlledBy = () => {
    return `<p style="text-align:center"><button id="open-menu-button">Open</button></p>
    <wam-popup controlledBy="open-menu-button">
        <wam-item label="Cut"></wam-item>
        <wam-item label="Copy"></wam-item>
        <wam-item label="Paste"></wam-item>
    </wam-toolbar>`
};

export const positionAtPoint = () => {
    const popup = createPopup();
    popup.style.fontSize = '1rem';

    const div = document.createElement('div');
    div.style.top = div.style.left = div.style.right = div.style.bottom = '0';
    div.style.position = 'absolute';
    div.style.fontSize = '4rem';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent= 'center';
    div.addEventListener('click',(e)=>{
        let element = e.target;
        while(element) {
            if(element == popup)
                return;
            element = element.parentElement;
        }
        
        popup.position = Menu.Position.AtPoint(e.pageX, e.pageY, 8);
        popup.open();
    
    })
    div.appendChild(document.createTextNode('Click Me'));
    div.appendChild(popup);

    return div;
}
positionAtPoint.storyName = 'Position At Point';

export const itemCollection =  () => {
    const popup = createStaticPopup();
    popup.iconFactory = materialIcon;

    popup.items.append({label:'Accessibility', icon:'accessibility'});
    popup.items.insertBefore({label:'Themes', icon:'color_lens'}, 1);
    
    return popup;
}
itemCollection.storyName = 'Item Collection Functions';

export const leaveOpen = ()=> {
    const items = [
        {label:'Close'},
        {label:'Leave Open', id:'leave-open'},
    ];
    const bar = Menu.Popup.create(items);
    bar.isPopup = true;
    bar.open();
    bar.addEventListener('wam-item-activate', (e)=>{
        if('leave-open' == e.detail.item.id)
            e.preventDefault();
    })
    return bar;
}
leaveOpen.storyName = 'Leave open with preventDefault()';

export const disabled = () =>
    `<wam-popup static>
        <wam-item label="Cut"></wam-item>
        <wam-item label="Copy"></wam-item>
        <wam-item label="Paste" disabled></wam-item>
    </wam-popup>`
disabled.storyName = 'Disabled Item';