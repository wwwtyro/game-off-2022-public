import { State } from "../model/model";
import { animationFrame } from "../util";

export async function levelEnd(state: State) {
  const div = document.getElementById("level-end")!;
  div.style.display = "block";
  div.innerText = "Level complete. Click to continue.";
  let done = false;
  div.addEventListener("click", function handleClick() {
    div.removeEventListener("click", handleClick);
    done = true;
  });
  while (!done) {
    await animationFrame();
  }
  div.style.display = "none";
}
