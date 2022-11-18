import { MenuButton, Menu, MenuHTML } from "./menu";

export async function intro() {
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(`
    <div style="text-align: center"><img src="static/title.png"></div>
    <div style="font-family: 'Electrolize', sans-serif; font-size: 18px; font-weight: normal">

      <p>
        The year is 2051. Astronomers have detected an enormous object hurtling towards our solar system 
        at relativistic speeds. Advanced telescopy revealed it to be an ancient, decrepit alien megastructure.
        Given its size and thermals, it was determined to be a Dyson sphere constructed around a brown dwarf star.
      </p>

      <p>
        Probes sent to the surface of the Dyson sphere are summarily destroyed, but not before being used to relay a message back to
        Earth: "Your solar outpost is scheduled for integration with the collective. Do not interfere."
      </p>

      <p>
        Left with little choice, the people of Earth prepare a preemptive attack: an artificial intelligence is trained to pilot a
        combat-ready spacecraft and launched at the invader. You are that autonomous soldier, and you have one job: forcibly assimilate
        the more advanced alien technology and use it to wreak as much havoc as possible. In other words, go in guns blazing.
      </p>
      
    </div>
  `)
  );
  menu.addItem(
    new MenuButton("Continue", () => {
      menu.exit();
    })
  );
  await menu.enter();
}
