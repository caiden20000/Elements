# Elements
Super Simple LittleAlchemy-type implementation
Try it here!: https://caiden20000.github.io/Elements/build/

Note: There are some hidden features, like "custom JSON creation mode" that you have to enable via devtools. That's the important bit about this project - you can specify EVERYTHING yourself in the JSON file.

Controls:
- Click + drag: Move an element
- Double click: Make that element a "source" element, click + dragging it will duplicate it. Double click again to reverse.
- Right click: Delete element
- Shift + click + drag: Duplicates an element

Customs Mode:
- Open Dev tools in your browser (`CTRL + SHIFT + I` in Firefox)
- In the console, type `customsEnabled = true`
- When you combine two elements that have no recipe, you will get a custom element maker. Type the name of the element in the box, then use the two color pickers below the box to change the body and text color. Press the submit on the top of the element to confirm the recipe.
- Now that recipe is registered in the session data
- To export the custom JSON file, type `exportJSON()` into the console, and copy the object it returns into a file.
- You can paste that object into `loadFromJSON(json)` to replace the recipes in the current session, though it won't delete anything on screen before applying, so new default elements will be placed on top of the old ones if present.
- When running your own instance of the code, put your custom JSON object into 'bits.json' to load it upon page open.

The JSON format, as well as the code, supports combining 2+ elements, as well as having 1+ resulting elements. It is a (current) limitation of the customs mode that you can't make more than 1 resultant element with the UI. It is also the result of the drag + drop style that you cannot currently create a 3+ element recipe, despite it being supported by all other parts of the code. Feel free to fork the repo and engage with that functionality yourself!

### TODO:
- Brainthink a way that 3+ elements could be combined (optional).
- Add a GPT version that generates the combination results on-the-fly.
