<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- windturbineclear). Edit glassbox.json, not this block. -->

<h1 align="center">WindTurbineClear</h1>

<p align="center"><b>How does a wind turbine make power?</b><br>A turbine does not get pushed round by the wind. Its blades are wings, and lift pulls them. Double the wind and the power goes up eight times, yet no rotor can ever take more than 59 percent. Open the nacelle, sweep the power curve and see why wakes cost a wind farm.</p>

<p align="center"><a href="https://glassbox.how/windturbineclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/windturbineclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/windturbineclear/"><img alt="Glassbox No. 232" src="https://img.shields.io/badge/Glassbox-No.%20232-8ef0ff"></a>
  <a href="https://glassbox.how/e/windturbineclear/"><img alt="Machines" src="https://img.shields.io/badge/field-Machines-ff7a59"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **Cube of the wind.** The power in the wind crossing a rotor is half the air density times the swept area times the wind speed cubed. Double the speed and the power goes up eight times. Double the rotor diameter and it goes up four times, which is why blades keep getting longer.
2. **Never all of it.** A rotor cannot stop the air or the air would pile up. In 1919 and 1920 Albert Betz showed that no open rotor can take more than 16/27 of the wind power, about 59.3 percent. Good blades capture roughly 45 percent. Slide the braking control and watch the peak sit at one third.
3. **A blade is a wing.** The wind does not push the blades flat on. They are airfoils. The wind and the blade's own motion combine into a relative wind, and the curved shape turns it into lift. Tilted forward, lift pulls the blade round, and drag only slows it. Too steep an angle and the flow separates: the blade stalls.
4. **Why blades are twisted.** The tip moves much faster than the root, so the relative wind arrives at a different angle along the blade. The tip-speed ratio is tip speed over wind speed, around 6 to 9. A twist from root to tip keeps each slice at a good angle of attack, and pitching the whole blade tunes it.
5. **Slow shaft, fast generator.** In the nacelle the rotor turns a low-speed shaft at about 5 to 15 rpm. A gearbox of around 1:100 lifts it to what a generator wants, or a direct-drive turbine uses a wide many-poled generator instead. Magnets pass coils, the changing field pushes current, and three sets of coils give three-phase power.
6. **The power curve.** Output starts at the cut-in speed, about 3 to 4 metres per second, climbs with the cube of the wind, and levels off at rated power around 11 to 13 metres per second. Above that the blades pitch to spill wind. At about 25 metres per second they feather and the turbine parks.
7. **Wakes and the grid.** Each turbine leaves slow, turbulent air behind it, so farms space turbines several rotor diameters apart. Capacity factors are roughly 25 to 45 percent onshore and 35 to 55 percent offshore. Output varies with the weather, so storage, other plants and wide spreading of farms fill the gaps.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Swept area** | The circle the blades sweep out; the wind power through it is half rho A v cubed. |
| **Betz limit** | The most any open rotor can take from the wind: 16/27, about 59.3 percent. |
| **Angle of attack** | The angle between the relative wind and the chord line of the blade. |
| **Tip-speed ratio** | Blade tip speed divided by the wind speed. |
| **Stall** | When the angle is too steep, the flow separates, lift drops and drag jumps. |
| **Pitch** | Turning a blade about its long axis; 90 degrees is feathered, edge-on to the wind. |
| **Nacelle** | The housing on top of the tower that holds the drivetrain, brake and controls. |
| **Cut-in, rated, cut-out** | The wind speeds at which a turbine starts, reaches full power, and shuts down. |
| **Wake** | The slower, more turbulent air behind a turbine. |
| **Capacity factor** | Yearly energy divided by the energy at rated power all year. |

## A short history

**From spinning mills in Persia and a 12 kW giant in Cleveland to 26 MW offshore machines.**

- **800** · Spinning mills on the Persian plateau (Unknown Persian millwrights, Sistan)
- **1887** · A cloth-sailed turbine lights a Scottish cottage (James Blyth, Marykirk, Scotland)
- **1888** · Brush's 12 kW giant in Cleveland (Charles F. Brush, Cleveland, Ohio)
- **1941** · Smith–Putnam feeds a grid (Palmer Putnam, built by S. Morgan Smith Company, Grandpa's Knob, Vermont)
- **1957** · The Gedser turbine shows the way (Johannes Juul, Gedser, Denmark)
- **1985** · California's wind rush (Californian developers, Altamont Pass, California)
- **2003** · Horns Rev: wind power goes large offshore (Elsam (now Ørsted), Off Jutland, North Sea)
- **2022** · A 15 MW prototype with 115 m blades (Vestas, Østerild, Denmark)

The full story, with 32 moments, charts, people and 33 sources: [glassbox.how/e/windturbineclear/history](https://glassbox.how/e/windturbineclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `windturbineclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/windturbineclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/windturbineclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
