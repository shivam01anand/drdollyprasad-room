# The Room — component dissection

Every surface in this room is traced to a painting. Nothing is invented, and nothing is
carried over from davidlee.studio except the mechanics.

## The governing problem

The original makes the room **white** so the art is the only colour. That is right for a
Glasgow painter whose canvases are dark and abstract, and wrong for her — a white cube is
a gallery, and her paintings are not set in galleries. They are set against cracked lime
plaster, old timber, brick and stone.

But if the room simply becomes warm ochre, her warm ochre paintings disappear into it.

**The resolution is saturation, not hue.** The room is built entirely from one desaturated
earth family — the bone / stone / bark / umber spine that k-means says is 60% of every
canvas she has painted. Within that family the surfaces differ by *texture and
reflectance*, not by colour. The paintings keep every scrap of chroma in the frame.

Three exceptions are allowed, each a direct quote from a specific canvas, each tiny:
the **turquoise flaking** on the door (*Bandh Darwaze III*), the **red thread**
(*Threads of Faith*), and the **diya flame** (*Vakratunda*, *The Aarti*).

## What kind of room

A bare room in an old Delhi house — a room off a courtyard, not a studio. Thick walls,
deep window reveal, exposed beams, a stone floor, a niche for the lamp. Spare and worn.

She is a painter of restraint who withholds the face in twenty of twenty-four figures.
Her room is not a decorated haveli. It is almost empty, and everything in it has age.

---

## A · Architecture

| # | Component | Where it comes from | Treatment |
|---|---|---|---|
| A1 | **Lime-plaster walls** | *Mother and Son* — a cracked, peeling plaster wall built with a palette knife, occupying two-thirds of the canvas and painted with as much care as the figures. Also *The Newspaper Reader*, *The Chai Boy* | Pale warm lime wash, low saturation. Procedural: fine noise + a crack network + patch repairs + water staining down from the sill |
| A2 | **Plaster loss → brick** | The gallery dressed its walls in **red brick panels** to meet her paintings (installation photograph, `42-ctx-gallery-view`) | Where the plaster has fallen away, courses of brick show through, desaturated. One panel on the back wall, as the gallery hung her |
| A3 | **Kota-stone floor** | The stone floors under *The Kadhai Seller*, *The Chai Boy*, *Three Women in Red* | Large slabs, visible joints, worn pale in the traffic line, darker at the edges |
| A4 | **Exposed timber ceiling** | Not a modern slab. The beams and purlins of an old room; the timber rails in *Threads of Faith* are the same material | Beams across the short span, plank soffit between |
| A5 | **The door** | ***Bandh Darwaze*** — all four paintings. Plank leaf, turquoise over brown flaking in torn islands, iron hasp, **padlock hanging open on its staple**, pull ring, domed studs, a carved interlace pilaster | The way in. The camera comes through it |
| A6 | **Deep window reveal + iron grille** | *Bandh Darwaze I* — the grille window is the light source. Thick wall, so the reveal is deep enough to cast its own shadow | A splayed reveal, an oxidised grille, a stone sill |
| A7 | **Chajja** (projecting eave) | Implied by the hard-edged light in every exterior-lit painting | Outside the window, so the shaft is cut cleanly rather than flooding |
| A8 | **Niche / taak** | *Vakratunda* and *The Aarti* — the flame needs a place to sit in a thick wall | A deep recess in the left wall. The diya lives here. In dark mode it is the only light |
| A9 | **Low stone plinth** | The ledge the kettle sits on in *The Chai Boy*; the platform in *Three Women in Red* | A worn stone bench along the back wall. Small sitters stand on it |
| A10 | **Sandstone course with incised राम** | ***Threads of Faith*** — the wall behind the bells is sandstone blocks cut with राम, repeated | One course above the plinth. The only lettering in the room, and it is hers |

## B · The sitters

Already modelled as lathe profiles. What changes is **material**, which until now was one
white plaster for everything.

| Object | Painting | Material |
|---|---|---|
| Three matkas | *Terracotta* (2015), *The Matka and the Coins* | Unfired clay — matte, slightly warm, the one object allowed to be properly terracotta because a whole canvas is |
| Three milk churns | *The Doodhwala*, *Shree 420* | Dented aluminium — low saturation, high roughness, soft specular |
| Kettle + coal stove | *The Chai Boy* | Aluminium on blackened iron |
| Brass bell | the bell held and never rung in three *Gone Are The Days* canvases | Brass — darker, warmer specular |
| Cart wheel | *The Bullocks*, *The Cart-Man and the Rupaya* | Weathered timber + iron tyre |
| Letter box | *Patra Petika* | Cast iron, worn paint |
| Thread hank | *Threads of Faith* (2024) | The one saturated red in the room |
| Coin stack | *The Matka and the Coins* | Dull white metal |
| Table, easel | the working surfaces | Old timber |

## C · Light

| | |
|---|---|
| **Day** | One shaft through the grille, cut by the chajja. Delhi light is warm and dusty, not Glasgow daylight — the sun is lowered in colour temperature and the ambient carries a bounce off the ochre floor |
| **Night** | The diya in the niche. In *Vakratunda* and *The Aarti* the flame is the only light source **and the only broken-out colour**; the room goes to near-black and the paintings are lit by one small warm pool |
| **Atmosphere** | Fine haze in the shaft. Her canvases are atmospheric, never optically clean |

## D · What a visitor should feel

They arrive at a closed door with the lock hanging open. They come through it into a worn,
almost empty room where the light falls in one shaft and everything is the colour of clay
and old lime — and the only things with any colour in them are the paintings on the walls.
The objects on the floor turn out to be the things in the paintings.

Nothing in the room is new. Nothing is decorated. One flame, when they want it.

---

## Direction taken — 4 Oct

Five variants were built and compared (`lib/room/variants.ts`, `./run-variants.sh`).
**Daylight is the ground, with the red field kept as a panel behind the hero.**

Not a compromise between the two — it is what the evidence shows. Her installation
photograph (`42-ctx-gallery-view`) is a neutral gallery with **red brick panels inserted
behind specific works**, a decision made by people who had the paintings in the room.

Why not the others:

- **Grisaille** is the most *correct* by her stated rule — the room gives up all colour and
  the canvases hold every bit of it. But a grey room is nearer David Lee's white cube than
  her world, and her walls, in painting after painting, are warm cracked plaster.
- **Ochre** puts room and art in one hue family, and the paintings start to disappear.
- **Diya** is the best single image of the five and cannot be the default — you cannot show
  forty-one paintings in the dark. It stays as the dark mode, which is what it always was.
- **Red ground** at full wall was too much; at panel scale it is exactly right.

All five remain runnable for comparison.

## Two additions that are not colour

**Tone on tone** (`plasterWithCoin`). Her most distinctive technical signature finally
exists in the room: a 20-paise coin pressed into the back wall, carried **in the bump
channel only** so it costs zero chroma. Invisible head-on; it appears when the shaft rakes
across the wall. The ellipse is pre-squashed to read circular once stretched over the
wall's 2.18:1 aspect.

**The close read** (shot D). No framing in the room came nearer than 2.3 m — a standing
gallery distance, and the wrong one for a painter whose strongest work is one-foot-square
readings of a hasp and a bolt. The camera now comes to 0.86 m off the door hardware, which
had to be rebuilt at the scale she paints it: a heavy hasp across the leaf with the padlock
**hanging open on its staple**, which is the entire subject of *Bandh Darwaze II*.

Her rule forbids a close crop only on a person. The ironwork is exactly what it is allowed
to come close to.

Six beats now, not five: Presence · What is leaving · What is still · The close read ·
The shrine · Plan.

---

## The rebuild — 4–5 Oct

The first room read as "a 90s game wall": procedural 512 px blotches restarted on every box,
flat light, razor-edged primitives, objects scattered. What changed, and why:

- **Surfaces are photographs** at physical scale (plaster 2 m, floor slabs ~0.6 m, door planks
  ~15 cm), mapped in world space so nothing tiles at a seam. Lime wash reflects ~70 %; the
  plaster photograph averages 37 %, so the wall carries a linear tint of ~1.8.
- **The hang is one wall per beat.** Back wall: the shrine niche, *Twenty Paise* on its red
  field, the four *Bandh Darwaze* panels as a block. Left: two *Gone Are The Days* canvases and
  the door out. Right: the recent work either side of the grille. The brick-loss panels are
  gone; the red field is the gallery's red brick, as one panel.
- **The niche moved to the back wall**, framed in sandstone cut with राम — the only lettering in
  the room, legible only up close.
- **Objects sit with their paintings** instead of being scattered: matkas below the shrine,
  thread and bell beside the lamp, coins at the foot of *Twenty Paise*, the angithi and kettle
  on the plinth, churns along the wall of recent work, the wheel leaning under the bullock cart,
  the woks by the door, the letter box in the corner.
- **Light is a room's light**: the grille's shaft (with haze), the door dappled by an unseen
  tree, the open side as one soft window, and one captured bounce.
- **The close read** is square to the leaf, hardware in the upper frame, header in light ink.
