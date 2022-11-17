import { animationFrame } from "../util";

export async function winGame() {
  const div = document.getElementById("center-content")!;
  div.style.display = "block";
  div.innerText = "You win! Click to continue.";
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
