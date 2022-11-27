import { MenuButton, Menu, MenuHTML } from "./menu";

export async function about() {
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(`
    <div style="text-align: center"><img src="static/title.png" class="title"></div>
    <p style="text-align: center">
      <a href="https://github.blog/2022-11-01-game-off-2022-theme-announcement/">
        GitHub Game Off 2022
      </a>
      submission by
      <a href="https://github.com/wwwtyro">Rye Terrell</a> (<a href="https://twitter.com/wwwtyro">@wwwtyro</a>). 
      Title and theme taken from the provided
      <a href="https://github.com/leereilly/list-of-english-cliches/blob/main/cliches.txt">list of clichés</a>.
    </p>
    <table style="margin: auto; border-spacing: 16px;">
      <tr><td colspan=2 style="color: yellow; text-align: center; font-size: 150%">Credits</td></tr>
      <tr>
        <td>Music</td>
        <td><a href="https://www.fesliyanstudios.com/">Fesliyan Studios</a></td>
      </tr>
      <tr>
        <td>Sprites</td>
        <td><a href="http://millionthvector.blogspot.com/p/free-sprites.html">Millionth Vector</a></td>
      </tr>
      <tr>
        <td>Icons</td>
        <td><a href="https://game-icons.net">Delapouite & Lorc</a></td>
      </tr>
      <tr>
        <td>Sound Effects</td>
        <td><a href="https://www.pmsfx.store/">PMSFX</a></td>
      </tr>
      <tr>
        <td>Textures</td>
        <td><a href="https://3dtextures.me/">3DTextures.me</a></td>
      </tr>
      <tr>
        <td>Decorative Text</td>
        <td><a href="https://cooltext.com/">CoolText.com</a></td>
      </tr>
      <tr><td colspan=2 style="color: yellow; text-align: center; font-size: 150%">Tech Stack</td></tr>
      <tr>
        <td>WebGL Library</td>
        <td><a href="https://github.com/regl-project/regl">regl 👑</a></td>
      </tr>
      <tr>
        <td>Physics Library</td>
        <td><a href="https://rapier.rs/">Rapier</a></td>
      </tr>
      <tr>
        <td>Math Library</td>
        <td><a href="https://glmatrix.net/">GL Matrix</a></td>
      </tr>
      <tr>
        <td>Audio Library</td>
        <td><a href="https://howlerjs.com/">Howler.JS</a></td>
      </tr>
    </table>
  `)
  );
  menu.addItem(
    new MenuButton("Back", () => {
      menu.exit();
    })
  );
  await menu.enter();
}
