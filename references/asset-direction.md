# Scrolline image direction

## Shared rules

- Treat each deck as its own editorial world. Give every opener a unique subject, palette, lens and lighting pattern.
- The first image is an original cinematic photograph with a clear focal point and deliberate negative space for the Korean title. Crop the saved hero to 16:9 at 1920 × 1080 and encode as WebP.
- Use one image per meaningful image-led scene. Make each scene asset specific to that scene; do not repeat an unrelated image to fill a gallery or scene slot.
- Keep charts, numerical evidence, route maps and precise diagrams in HTML or SVG. Photography can establish atmosphere, but must not be presented as proof of a measured outcome.
- Mark fictional people, brands, places and performance as a conceptual or fictional case in adjacent presentation copy. Avoid text, logos, legible charts and visual claims inside generated imagery.
- Supporting images use a 16:9 crop unless a scene specifies a gallery crop. Keep focal subjects near the center safe area so mobile crops retain them.
- Save generated source files outside the repository and ship only optimized, deck-local WebP assets under `examples/<deck>/public/media/<deck>/<scene>/`.

## Deck art direction

| Deck | Visual identity | Image subjects |
|---|---|---|
| `sample-deck` | Ink blue, amber light, independent documentary photography | A Seoul rooftop recovering its night sky; close scene details that make the scroll and presentation metaphor tangible; six distinct visual studies for the template gallery. |
| `product-launch` | Silver, graphite and electric lime; tactile industrial product photography | A fictional Nimbus Air over-ear headphone in use, with matching hinge, cushion and microphone details. Keep the hardware consistent across images. |
| `annual-report` | Charcoal, ivory and restrained vermilion; formal architectural editorial photography | Work, logistics and organizational change as metaphorical scenes. Put all actual performance evidence in SVG charts and state that the example is fictional. |
| `city-guide` | Indigo dusk, coral sunset and lantern amber; observational Seoul travel photography | River paths, neighborhood streets, food and rest stops. Build six postcard images as separate photographs with distinct locations and subjects. |
| `investor-pitch` | Cobalt dusk, warm brass and neighborhood cafe photography | A fictional local reservation service that helps independent cafes fill quiet hours. Show real cafe contexts, owners and nearby guests; render market and pilot figures in HTML/SVG and label them as fictional. |
| `research-lecture` | Mist teal and pale gold; restrained urban field documentation | Seoul sidewalks, heat exposure and tree shade. Treat all example numbers as synthesized lecture data; render charts and routes from explicit values in HTML/SVG. |
| `client-proposal` | Warm walnut, cream and leaf green; candid independent-bookshop photography | A fictional neighborhood bookshop's peak-hour queue, browsing, consultation and checkout. Label generated scenes as illustrative and keep pilot figures in HTML/SVG as fictional scenarios. |

## Review checklist

- Is the image unique to its deck and scene?
- Does the first image make the audience curious in the opening two scenes while leaving room to read the title?
- Does the crop preserve the important subject at desktop and mobile aspect ratios?
- Could any fictional setting, person or result be mistaken for a real documented claim? If so, label it in adjacent copy or replace the image.
- Did an SVG or HTML visual replace photography where accuracy matters?

## Generated asset manifest

Photographic entries are original `source=generated` images unless the source column says otherwise. Prompts described the subject and art direction in the intent column, requested composition for the named scene, and prohibited legible generated text or false evidence where relevant. Files are optimized WebP crops. Hero crops are usually 1920 × 1080; gallery crops are usually 1200 × 900; other supporting crops are usually 1600 × 900. The alt column describes the focal subject for each individual file.

### Seven presentation decks

| Asset | Source | Prompt / intent | Crop | Alt / focal point |
|---|---|---|---|---|
| `examples/sample-deck/public/media/sample-deck/01-hero/hero.webp` | generated | Seoul rooftop observer, city glow and a sky recovering its stars. | 1920 × 1080 | Lone rooftop observer faces a Seoul skyline and newly visible stars. |
| `examples/sample-deck/public/media/sample-deck/07-templates/image-01.webp` | generated | Amber tungsten light cuts through dark haze. | 1200 × 900 | Single amber light glows in a dark studio. |
| `examples/sample-deck/public/media/sample-deck/07-templates/image-02.webp` | generated | Hand turns tactile brass dial to suggest progressive reveal. | 1200 × 900 | Hand rests on a brass instrument dial. |
| `examples/sample-deck/public/media/sample-deck/07-templates/image-03.webp` | generated | Three light pools recede along a museum corridor. | 1200 × 900 | Three lights lead down a blue corridor. |
| `examples/sample-deck/public/media/sample-deck/07-templates/image-04.webp` | generated | Sculptural folded cream paper catches amber light. | 1200 × 900 | Folded paper forms an angular sculpture. |
| `examples/sample-deck/public/media/sample-deck/07-templates/image-05.webp` | generated | Small mechanical assembly arranged diagonally. | 1200 × 900 | Metal mechanism parts sit in a diagonal row. |
| `examples/sample-deck/public/media/sample-deck/07-templates/image-06.webp` | generated | Six amber glass specimens form a still life. | 1200 × 900 | Six amber glass forms align against charcoal blue. |
| `examples/sample-deck/public/media/sample-deck/08-demo/poster.webp` | generated, legacy | Earlier abstract projection on a Seoul studio stage. | 1600 × 900 | Presenter stands beside a large abstract projection. |
| `examples/product-launch/public/media/product-launch/01-hero/hero-v2.webp` | generated | Fictional Nimbus Air over-ear headphones in a commuter setting, with silver hinge and graphite cushions. | 1600 × 900 | Listener wears the graphite and silver headphones on a city commute. |
| `examples/product-launch/public/media/product-launch/04-design/image-v2.webp` | generated | Close view of the matching headphone hinge, brushed metal cup and padded headband. | 1600 × 900 | Brushed hinge joins the cup and padded band. |
| `examples/product-launch/public/media/product-launch/05-features/image-v2.webp` | generated | Close view of the matching graphite ear cup, soft cushion and small microphone openings. | 1600 × 900 | Ear cushion and microphone ports on a low profile ear cup. |
| `examples/annual-report/public/media/annual-report/01-hero/hero.webp` | generated | Analyst and illuminated archive aisle frame a fictional annual review. | 1920 × 1080 | Analyst faces a hall of warm vertical lights. |
| `examples/annual-report/public/media/annual-report/06-mix/image-01.webp` | generated | Earlier fictional revenue mix: staff prepare a seasonal pop-up display. | 1600 × 900 | Worker prepares a temporary retail display. |
| `examples/annual-report/public/media/annual-report/06-mix/image-02.webp` | generated | Later fictional revenue mix: repeat orders move through organized fulfillment. | 1600 × 900 | Worker packs repeat orders in a neat warehouse. |
| `examples/annual-report/public/media/annual-report/08-risks/image.webp` | generated | Fictional operations team reviews workplace safety. | 1600 × 900 | Worker checks protective equipment beside a floor line. |
| `examples/city-guide/public/media/city-guide/01-hero/hero.webp` | generated | Seoul river at sunset, warm neighborhood lights and an evening route. | 1920 × 1080 | Walkers cross a bridge above a coral-lit river. |
| `examples/city-guide/public/media/city-guide/04-postcards/image-01.webp` | generated | Euljiro workshop alley at blue hour. | 1200 × 900 | Passersby move through a narrow workshop lane. |
| `examples/city-guide/public/media/city-guide/04-postcards/image-02.webp` | generated | Cheonggyecheon stepping stones and bridge at dusk. | 1200 × 900 | Walkers cross stones beside a dusk-lit stream. |
| `examples/city-guide/public/media/city-guide/04-postcards/image-03.webp` | generated | Ikseon-dong hanok courtyard with timber lattice and lantern. | 1200 × 900 | Lantern illuminates a wooden hanok courtyard. |
| `examples/city-guide/public/media/city-guide/04-postcards/image-04.webp` | generated | Gwangjang Market griddle and vendor's hands. | 1200 × 900 | Mung-bean pancake sizzles on a market griddle. |
| `examples/city-guide/public/media/city-guide/04-postcards/image-05.webp` | generated | Hangang bridge and cyclists at coral sunset. | 1200 × 900 | Cyclists cross a bridge above the sunset river. |
| `examples/city-guide/public/media/city-guide/04-postcards/image-06.webp` | generated | Small Seoul record shop, browsing visitor and warm lamp. | 1200 × 900 | Visitor browses records in a night-lit shop. |
| `examples/city-guide/public/media/city-guide/05-pause/poster.webp` | generated | Slow water and a seated figure create a blue-hour pause. | 1600 × 900 | Figure pauses beside lantern reflections on water. |
| `examples/investor-pitch/public/media/investor-pitch/01-hero/hero.webp` | generated | Fictional water sensor prototype assembled in a Seoul workshop. | 1920 × 1080 | Founder assembles a prototype on a sunlit workbench. |
| `examples/investor-pitch/public/media/investor-pitch/04-product/image.webp` | generated | Fictional cobalt water sensor beside a clear sample bottle. | 1600 × 900 | Compact water sensor sits beside a sample bottle. |
| `examples/research-lecture/public/media/research-lecture/01-hero/hero.webp` | generated | Researcher at a misty coastal wetland establishes field-science mood. | 1920 × 1080 | Researcher stands among reeds above a misty wetland. |
| `examples/research-lecture/public/media/research-lecture/08-limits/image.webp` | generated | Researcher regards a changing shoreline to convey study limits. | 1600 × 900 | Researcher looks across a mist-softened shoreline. |
| `examples/research-lecture/public/media/research-lecture/09-implications/image-01.webp` | generated | Salt-marsh plants cluster along a tidal pool at morning. | 1600 × 900 | Young marsh plants grow beside teal tidal water. |
| `examples/research-lecture/public/media/research-lecture/09-implications/image-02.webp` | generated | Researcher and community member observe the wetland together. | 1600 × 900 | Two people view a wetland from a low boardwalk. |
| `examples/client-proposal/public/media/client-proposal/01-hero/hero.webp` | generated | Architect and librarian discuss a fictional neighborhood library. | 1920 × 1080 | Architect and librarian look toward a sunlit window. |
| `examples/client-proposal/public/media/client-proposal/01-hero/hero-v2.webp` | generated | Customer proposal opens on a contemporary neighborhood store and its peak-hour queue. | 1672 × 941 | Warm retail interior, customers waiting and staff greeting them. |
| `examples/client-proposal/public/media/client-proposal/02-challenge/peak-queue.webp` | generated | Fictional premium bookshop at after-work peak; customers wait to ask and pay, with clear text space at left. | 1672 × 941 | Customers queue at a warm-lit shop counter; AI-generated illustration for the fictional case. |
| `examples/client-proposal/public/media/client-proposal/04-journey/discovery.webp` | generated | Customer compares books in the same fictional neighborhood shop. | 1448 × 1086 | Customer browses two books; AI-generated illustration for the fictional case. |
| `examples/client-proposal/public/media/client-proposal/04-journey/consultation.webp` | generated | Bookseller listens to a question and points toward the right shelf. | 1448 × 1086 | Bookseller helps a customer find a shelf; AI-generated illustration for the fictional case. |
| `examples/client-proposal/public/media/client-proposal/04-journey/checkout.webp` | generated | Customer completes a purchase as another visitor waits behind. | 1448 × 1086 | Bookseller hands a bag to a customer at the till; AI-generated illustration for the fictional case. |
| `examples/client-proposal/public/media/client-proposal/07-impact/image-01.webp` | generated | Fictional renewed library welcomes neighbors and children. | 1600 × 900 | Visitors use a warm, open neighborhood reading room. |
| `examples/client-proposal/public/media/client-proposal/07-impact/image-02.webp` | generated | Shared table beneath a new courtyard tree. | 1600 × 900 | Neighbors share a table in a planted courtyard. |
| `examples/client-proposal/public/media/client-proposal/09-governance/operations-v2.webp` | generated | Store manager reviews a point-of-sale terminal and handwritten operating notes, with anonymous customers in the background. | 1672 × 941 | Context image for a proposed anonymous aggregation workflow, not evidence of actual data handling. |

### Fictional spatial proposal

These images depict one coherent fictional design: retain an existing 320㎡ first floor and add a 320㎡ second floor, for a total 640㎡ neighborhood library. They are concept images, not photographs or evidence of a built project.

| Asset | Source | Prompt / intent | Crop | Alt / focal point |
|---|---|---|---|---|
| `examples/spatial-proposal/public/media/spatial-proposal/01-hero/hero.webp` | generated | Two-storey library addition at blue hour; oak entry, pale brick and street tree. | 1920 × 1080 | Glowing two-storey library stands beneath a street tree. |
| `examples/spatial-proposal/public/media/spatial-proposal/02-before/image-01.webp` | generated | Existing 320㎡ one-storey service center before work. | 1600 × 900 | Plain one-storey brick civic building before renovation. |
| `examples/spatial-proposal/public/media/spatial-proposal/02-before/image-02.webp` | generated | Matching after state adds a 320㎡ second storey. | 1600 × 900 | Oak and glass library addition transforms the same civic building. |
| `examples/spatial-proposal/public/media/spatial-proposal/03-thesis/image.webp` | generated | Oak-floored route connects street, reading room and courtyard. | 1600 × 900 | Visitor walks along a clear central library route. |
| `examples/spatial-proposal/public/media/spatial-proposal/04-gallery/image-01.webp` | generated | Oak entry portal and pale brick viewed from sidewalk. | 1200 × 900 | Oak portal marks the library entrance. |
| `examples/spatial-proposal/public/media/spatial-proposal/04-gallery/image-02.webp` | generated | Open ground floor and low shelves face the courtyard. | 1200 × 900 | Low shelves open toward a leafy courtyard. |
| `examples/spatial-proposal/public/media/spatial-proposal/04-gallery/image-03.webp` | generated | Window reading nook with oak bench and tree view. | 1200 × 900 | Oak window seat looks out toward a tree. |
| `examples/spatial-proposal/public/media/spatial-proposal/04-gallery/image-04.webp` | generated | Children's discovery area with low shelving. | 1200 × 900 | Parent and child read beside low bookshelves. |
| `examples/spatial-proposal/public/media/spatial-proposal/04-gallery/image-05.webp` | generated | Neighbors gather around a library commons table. | 1200 × 900 | Neighbors meet around a long oak table. |
| `examples/spatial-proposal/public/media/spatial-proposal/04-gallery/image-06.webp` | generated | Library facade glows through glass at dusk. | 1200 × 900 | Warm reading room glows behind a dusk facade. |
| `examples/spatial-proposal/public/media/spatial-proposal/05-materials/image-01.webp` | generated | Handmade pale brick meets honed limestone. | 1600 × 900 | Textured brick meets a smooth limestone sill. |
| `examples/spatial-proposal/public/media/spatial-proposal/05-materials/image-02.webp` | generated | Oak handrail joinery with a hand for scale. | 1600 × 900 | Hand touches a finely joined oak rail. |
| `examples/spatial-proposal/public/media/spatial-proposal/05-materials/image-03.webp` | generated | Sage-green handmade glazed wall tile. | 1600 × 900 | Irregular sage glaze catches the daylight. |
| `examples/spatial-proposal/public/media/spatial-proposal/05-materials/image-04.webp` | generated | Pale timber acoustic slats and concealed linear light. | 1600 × 900 | Timber ceiling slats frame a warm light. |
| `examples/spatial-proposal/public/media/spatial-proposal/06-journey/image-01.webp` | generated | Visitor crosses the entry threshold toward the commons. | 1600 × 900 | Visitor enters through the oak portal. |
| `examples/spatial-proposal/public/media/spatial-proposal/06-journey/image-02.webp` | generated | Visitor browses low shelves on the way to a nook. | 1600 × 900 | Reader browses a low shelf in daylight. |
| `examples/spatial-proposal/public/media/spatial-proposal/06-journey/image-03.webp` | generated | Neighbors share a table as staff offer help. | 1600 × 900 | Librarian speaks with a visitor beside a shared table. |
| `examples/spatial-proposal/public/media/spatial-proposal/07-seating/image-01.webp` | generated | Built-in window bench provides quiet seating. | 1600 × 900 | Two readers sit along the window bench. |
| `examples/spatial-proposal/public/media/spatial-proposal/07-seating/image-02.webp` | generated | Wheelchair user and companion share an accessible table. | 1600 × 900 | Wheelchair user sits beside a companion at a table. |
| `examples/spatial-proposal/public/media/spatial-proposal/08-experience/image.webp` | generated | Afternoon commons shows varied everyday library activity. | 1600 × 900 | Visitors read and browse in a sunlit commons. |
| `examples/spatial-proposal/public/media/spatial-proposal/09-accessibility/image-01.webp` | generated | Flush entrance accommodates mobility devices. | 1600 × 900 | Wheelchair and stroller pass through a level entry. |
| `examples/spatial-proposal/public/media/spatial-proposal/09-accessibility/image-02.webp` | generated | Accessible family room with turning space and transfer rail. | 1600 × 900 | Family room has a clear turning area. |
| `examples/spatial-proposal/public/media/spatial-proposal/10-operations/image.webp` | generated | Staff return books along a durable service path. | 1600 × 900 | Staff shelves books along a clear aisle. |
| `examples/spatial-proposal/public/media/spatial-proposal/11-next/poster.webp` | generated | Blue-hour exterior returns to the glowing library entrance. | 1600 × 900 | Library windows glow beneath a blue evening sky. |

### Generated during an earlier scene map

The following original images were made for scene IDs that were removed while the decks were revised. They are not referenced by current deck JSON and can be removed during asset cleanup.

| Asset | Source | Prompt / intent | Crop | Alt / focal point |
|---|---|---|---|---|
| `examples/annual-report/public/media/annual-report/02-claim/image.webp` | generated | Dawn warehouse aisle as a metaphor for a more organized fictional operation. | 1600 × 900 | Worker walks through a quiet warehouse aisle. |
| `examples/city-guide/public/media/city-guide/02-route/image.webp` | generated | Dusk riverside path curves toward a lantern-lit Seoul neighborhood. | 1600 × 900 | Walkers follow a riverside path toward city lights. |
| `examples/investor-pitch/public/media/investor-pitch/02-problem/image.webp` | generated | Volunteer collects a river sample to establish a fictional water-quality problem. | 1600 × 900 | Gloved hand holds a sample bottle beside a river. |
| `examples/product-launch/public/media/product-launch/02-problem/image.webp` | generated | Evening apartment during a brief power outage. | 1600 × 900 | Family gathers near a window during an outage. |
| `examples/research-lecture/public/media/research-lecture/03-method/image.webp` | generated | Researcher's hands collect a water sample in a coastal wetland. | 1600 × 900 | Gloved hands hold a vial above wetland water. |
| `examples/sample-deck/public/media/sample-deck/02-question/image.webp` | generated | Hand hovers over a trackpad as a scrollytelling presentation fills a screen. | 1600 × 900 | Hand hovers above a laptop trackpad. |

| `examples/research-lecture/public/media/research-lecture/01-hero/hero.webp` | generated | Korean pedestrian walking from harsh sun into tree shade on a Seoul street; urban heat and shade access lecture opener. | 1672 × 941, served as responsive 16:9 hero | Korean pedestrian crosses a strong sun/shade boundary beneath city trees. |
| `examples/investor-pitch/public/media/investor-pitch/01-hero/hero-v2.webp` | generated | A quiet Seoul cafe at dusk with open seats, an owner greeting a guest and another customer checking a reservation; fictional cafe marketplace opener. | 1672 × 941, served as responsive 16:9 hero | Open cafe tables and local guests at a warm-lit Seoul cafe. |

### Rebuild additions and media audit

The image files below were generated for the revised storyboards. They are illustrative scenes for fictional examples. Their crops were inspected at presentation scale and decoded after WebP export. Photography supports the stated scene; it does not establish measurements, actual customer behavior, or project outcomes.

| Asset | Source | Message and subject | Crop | Alt / focal point |
|---|---|---|---|---|
| `examples/sample-deck/public/media/sample-deck/08-demo/demonstration.webp` | generated | A presenter uses one potted maple to make a before / during / after change understandable. | 1672 × 941, 16:9 | Presenter gestures to the maple's three visible growth states. |
| `examples/sample-deck/public/media/sample-deck/08-demo/sequence-before.webp` | generated crop | The same maple before leaves appear. | 390 × 505, portrait panel crop | Bare potted maple on the presentation display. |
| `examples/sample-deck/public/media/sample-deck/08-demo/sequence-during.webp` | generated crop | The same maple as its first leaves appear. | 400 × 505, portrait panel crop | Potted maple with fresh leaves. |
| `examples/sample-deck/public/media/sample-deck/08-demo/sequence-after.webp` | generated crop | The same maple with a full canopy. | 425 × 505, portrait panel crop | Leafy potted maple on the presentation display. |
| `examples/sample-deck/public/media/sample-deck/07-templates/sample-screen-readable.webp` | rendered from the sample deck | A full browser capture of the sample deck's evidence scene, chosen as a readable example of claim and visual support on one screen. | 1920 × 1080, 16:9 | The sample deck pairs one claim with visual support and a source line. |
| `examples/investor-pitch/public/media/investor-pitch/02-problem/sequence.webp` | generated | Fictional cafe owner notices open seats, marks a reservation, then welcomes the arriving guest. | 1672 × 941, three-panel 16:9 | Cafe owner serves a guest after filling an empty table. |
| `examples/investor-pitch/public/media/investor-pitch/02-problem/quiet-hour.webp` | generated crop | Start state: empty seats are visible while the owner notices the quiet hour. | 555 × 941, portrait panel crop | Cafe owner looks toward an empty window table. |
| `examples/investor-pitch/public/media/investor-pitch/02-problem/booking.webp` | generated crop | Middle state: owner prepares a reservation marker as a guest approaches. | 553 × 941, portrait panel crop | Owner prepares a table as a guest enters. |
| `examples/investor-pitch/public/media/investor-pitch/02-problem/arrival.webp` | generated crop | End state: the guest sits at the previously empty table. | 556 × 941, portrait panel crop | Owner welcomes a seated guest. |
| `examples/product-launch/public/media/product-launch/03-promise/commute-calm-v2.webp` | generated, informed by Nimbus hero product silhouette | Evening commuter wearing over-ear headphones against a motion-blurred station, with open space for live headline. This illustrates the use situation rather than measured noise reduction. | 1672 × 941, 16:9 | Person finds a moment of calm on a busy commute. |

The sample deck screenshot is an actual browser capture of HTML/CSS. Its text is rasterized because the captured slide is shown as an image inside the gallery; the slide itself remains browser-rendered HTML.

#### Deck-wide audit notes

| Deck | Media review and implementation note |
|---|---|
| Sample | The six gallery photos are separate visual studies, not evidence for presentation advice. The old `08-demo/poster.webp` depicts an abstract projection; use the maple demonstration assets above for a legible object change. The full `demonstration.webp` is a presentation photo; the three panel crops are optional staged states. |
| Nimbus Air | The current product photos consistently show over-ear headphones. Use the `hero-v2.webp`, `04-design/image-v2.webp` and `05-features/image-v2.webp` variants. The older `image.webp` files in design / feature folders depict a home appliance and are stale. The generated `04-features/plate-*.webp` files contain baked-in Korean copy and spec graphics; treat them as legacy, and render claims, units and targets as HTML/SVG with explicit fictional / design-target labels. |
| City guide | Keep location photography distinct from precise route and travel-time evidence. Use HTML/SVG for routes and comparison values; label fictional itinerary details in copy. |
| Research lecture | The Seoul shade photos are scene setting only. The lecture's sample counts and values are synthesized; maps, observation blocks and charts must be encoded from explicit values in HTML/SVG, with denominator and synthetic-data labels in view. |
| Spatial proposal | The existing image set covers the exterior, before / after, library use, materials, seating, accessibility and operations. Keep each crop attached to its actual design choice; generated images show a fictional concept, not a built project. The four material photos are distinct and support a material-priority board without extra photography. |
| Investor pitch | Earlier water-sampling and analyzer photos are unrelated to the cafe story and should not be referenced. The new cafe sequence is an illustrative fictional case; any occupancy, booking or revenue values belong in HTML/SVG with scenario labels. |
| Annual report | Work and operations photos are illustrative. Financial and organizational claims must be rendered from explicit fictional data in HTML/SVG and labeled as a sample report. |
| Client proposal | Bookshop photos show one fictional customer journey. Keep generated imagery adjacent to an illustrative-case label; pilot and impact figures remain proposed scenarios in HTML/SVG. |

Legacy files stay on disk when an existing consumer may still reference them; inspect active asset references before removing any file.
