import Menu from '../dist/webapp-menu';

export default {
  title: 'Nested Menu',
  component: Menu.NestedMenu
}

export const htmlInit = () => 
  `<wam-nestedmenu>
    <wam-item label="Rock"></wam-item>
    <wam-submenu><span slot="label">Animal</span>
          <wam-item label="Cat"></wam-item>
          <wam-item><span slot="label">Dog</span></wam-item>
          <wam-item label="Reptile"></wam-item>
          <wam-item label="Top Hat Wearing Monkey"></wam-item>
    </wam-submenu>
    
    <wam-submenu label="Plant">
      <wam-item label="Brocolli"></wam-item>
      <wam-item label="Daisy"></wam-item>
      <wam-item label="Maple Tree"></wam-item>
      <wam-item label="Apple Tree"></wam-item>
      <wam-item label="Marigold"></wam-item>
      <wam-item label="Ivy"></wam-item>
      <wam-item label="Morning Glory"></wam-item>
    </wam-submenu>
    </wam-nestedmenu>`;
htmlInit.storyName = 'HTML'