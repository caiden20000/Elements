var gameArea: HTMLDivElement = document.getElementById("gamearea") as HTMLDivElement;
var bitList: Bit[] = [];
var ENABLE_CUSTOMS = true;

var userIn = {
    shiftDown: false,
    mouse: {
        down: false,
        x: 0,
        y: 0
    },
    bit: {
        bit: null as Bit | null,
        element: null as HTMLDivElement | null,
        x: 0,
        y: 0,
    }
}

var customsData = {
    bit: {
        name: "",
        color: "",
        textColor: ""
    } as BitTemplate,
    combo: {
        ingredients: [],
        results: []
    } as ComboTemplate
}

var possibleBits: BitTemplate[] = [];
var combinations: Combination[] = [];

interface BitTemplate {
    name: string;
    color: string;
    textColor: string;
}

interface ComboTemplate {
    ingredients: string[];
    results: string[];
}

// var dragging = {
//     mouseDown: false,
//     bitElement: null,
//     bit: null,
//     clickX: 0,
//     clickY: 0,
//     elementX: 0,
//     elementY: 0
// };

// var userIn.shiftDown = false;

// var customElement;
// var customCombo1, customCombo2;

class Bit {
    name: string;
    color: string;
    textColor: string;
    element: HTMLDivElement;
    isBase: boolean;
    constructor(name: string, color: string, textColor: string, isBase: boolean = false) {
        this.name = name;
        this.color = color;
        this.textColor = textColor;
        this.element = document.createElement("div");
        this.isBase = isBase;
        this.initElement(gameArea);
        bitList.push(this);
    }

    static fromTemplate(template: BitTemplate) {
        return new Bit(template.name, template.color, template.textColor);
    }

    static fromName(bitName: string): Bit | null {
        for (let template of possibleBits) {
            if (template.name == bitName) return Bit.fromTemplate(template);
        }
        return null;
    }

    setPosition(x: number, y: number) {
        this.element.style["top"] = `${y}px`;
        this.element.style["left"] = `${x}px`;
    }

    spawnCopy() {
        let copyBit = new Bit(this.name, this.color, this.textColor, false);
        let rect = this.getRect();
        copyBit.setPosition(rect.left, rect.top);
        return copyBit;
    }

    getRect(): DOMRect {
        return this.getRect();
    }

    initElement(area: HTMLDivElement) {
        this.element.appendChild(document.createTextNode(this.name));
        this.element.classList.add("element");
        this.element.style.background = this.color;
        this.element.style.color = this.textColor;
        area.appendChild(this.element);

        this.element.addEventListener("mousedown", e => {
            let targetBit: Bit;
            // Copy when is "base" or holding shift
            if (this.isBase || userIn.shiftDown) targetBit = this.spawnCopy();
            else targetBit = this;
            userIn.bit.element = targetBit.element;
            userIn.bit.bit = targetBit;
            let rect = targetBit.getRect()
            userIn.bit.x = rect.left;
            userIn.bit.y = rect.top;
            // Make element TOP on z
            targetBit.putOnTop();
        })
    }

    // combine(bit: Bit) {
    //     console.log("Combinging with " + bit.name);
    //     let result = getCombinationResult(this.name, bit.name);
    //     if (result != null) {
    //         let newPos = findMidpoint(this, bit);
    //         if (this.isBase == false) this.remove();
    //         if (bit.isBase == false) bit.remove();
    //         result.setPosition(newPos.left, newPos.top);
    //     }
    // }

    // removes from list and DOM
    remove() {
        let index = bitList.indexOf(this);
        if (index > -1) bitList.splice(index, 1);
        this.element.remove();
    }

    putOnTop() {
        // Put on top in DOM
        gameArea.insertBefore(this.element, null);
        // Remove and put on top of elementList
        let index = bitList.indexOf(this);
        if (index > -1) bitList.splice(index, 1);
        bitList.push(this);
    }
}

function getRectOverlap(rect1: DOMRect, rect2: DOMRect) {
    let vertOverlap = Math.max(0, Math.min(rect1.bottom - rect2.top, rect2.bottom - rect1.top));
    let horiOverlap = Math.max(0, Math.min(rect1.right - rect2.left, rect2.right - rect1.left));
    let overlapArea = vertOverlap * horiOverlap;
    return overlapArea;
}

// elBox is released element.
// Finds the elements elBox overlaps.
// Gets the element most overlapped by elBox.
function findOverlap(bit: Bit) {
    let rect1 = bit.getRect();
    let maxOverlap = 0;
    let overlapBit: Bit | null = null;
    for (let secondBit of bitList) {
        if (secondBit === bit) continue;
        let rect2 = secondBit.getRect();
        let overlapArea = getRectOverlap(rect1, rect2);
        if (overlapArea > 0 && overlapArea >= maxOverlap) {
            maxOverlap = overlapArea;
            overlapBit = secondBit;
        }
    }
    if (overlapBit != null) combineBits([bit, overlapBit]);
}

function combineBits(bits: Bit[]) {
    const bitNames = bits.map(bit => bit.name);
    const results = getCombinationResult(bitNames);
    if (results.length != 0) {
        const rectList = bits.map(bit => bit.getRect())
        const newPos = findMidpoint(rectList);
        for (let bit of bits) {
            if (!bit.isBase) bit.remove();
        }
        // TODO: Space out multiple combo results
        for (let result of results) result.setPosition(newPos.left, newPos.top);
    }
}

function findMidpoint(rects: DOMRect[]) {
    let avgTop = 0;
    let avgLeft = 0;
    for (let rect of rects) {
        avgTop += rect.top;
        avgLeft += rect.left;
    }
    avgTop /= rects.length;
    avgLeft /= rects.length;

    return {
        top: avgTop,
        left: avgLeft
    };
}


document.addEventListener("keydown", e => {
    if (e.key == "Shift") userIn.shiftDown = true;
});

document.addEventListener("keyup", e => {
    if (e.key == "Shift") userIn.shiftDown = false;
});

document.addEventListener("mousedown", e => {
    userIn.mouse.down = true;
    userIn.mouse.x = e.pageX;
    userIn.mouse.y = e.pageY;
});

document.addEventListener("mouseup", e => {
    // TODO: Put dragged element on end of elementList
    // to mirror gameArea child order
    if (userIn.bit.bit != null) findOverlap(userIn.bit.bit);
    userIn.mouse.down = false;
    userIn.bit.element = null;
    userIn.bit.bit = null;
    userIn.mouse.x = 0;
    userIn.mouse.y = 0;
});

document.addEventListener("mousemove", e => {
    if (userIn.mouse.down && userIn.bit.bit) {
        let dx = e.pageX - userIn.mouse.x;
        let dy = e.pageY - userIn.mouse.y;
        userIn.bit.bit.setPosition(userIn.bit.x + dx, userIn.bit.y + dy)
    }
});

// Removes first appearance of item in array
// Returns true if deletion occurs
function removeFirst(array: any[], item: any) {
    let index = array.indexOf(item);
    if (index != -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}


class Combination {
    ingredients: string[];
    results: string[];
    constructor(ingredients: string[], results: string[]) {
        this.ingredients = ingredients;
        this.results = results;
    }

    static fromTemplate(template: ComboTemplate) {
        return new Combination(template.ingredients, template.results);
    }

    // Returns true if all strings in 'names' are in this.ingredients
    match(names: string[]) {
        // TODO check if all elements in names are in ingredients
        if (names.length != this.ingredients.length) return false;
        names.sort();
        this.ingredients.sort();
        for (let i=0; i<names.length; i++) {
            if (names[i].toLowerCase() != this.ingredients[i].toLowerCase()) return false;
        }
        return true;
    }
    
    getResults(): Bit[] {
        let bits: Bit[] = [];
        for (let bitName of this.results) {
            let bit = getBitFromPossible(bitName);
            if (bit) bits.push(bit);
        }
        return bits;
    }

    asTemplate(): ComboTemplate {
        return {
            ingredients: this.ingredients,
            results: this.results
        }
    }
}

function getBitFromPossible(bitName: string) {
    for (let bit of possibleBits) {
        if (bit.name.toLowerCase() == bitName.toLowerCase()) {
            return new Bit(bit.name, bit.color, bit.textColor);
        }
    }
    if (ENABLE_CUSTOMS) createCustomBit(bitName);
    return null;
}

// Returns an ElementBox or null
function getCombinationResult(bitNames: string[]): Bit[] {
    for (let combo of combinations) {
        if (combo.match(bitNames)) return combo.getResults();
    }
    if (ENABLE_CUSTOMS) createCustomCombination(bitNames);
    return [];
}

function doesBitExist(bitName: string) {
    for (let template of possibleBits) {
        if (template.name.toLowerCase() == bitName.toLowerCase()) return true;
    }
    return false;
}

//////////////////////
// Customs loading  //
//////////////////////

function getJSONFromFile(filename: string, callback: Function) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var result = JSON.parse(this.responseText);
            callback(result);
        }
    };
    xmlhttp.open("GET", filename, false);
    xmlhttp.send();
}

function populateLists(filename: string = "bits.json") {
    console.log("Requesting combinations...");
    getJSONFromFile(filename, (file: any) => {
        console.log("Recieved! Applying combinations...");
        possibleBits = file.bits;
        for (let combo of file.combinations) {
            combinations.push(Combination.fromTemplate(combo));
        }
        console.log("Loaded!");
    })
}

//////////////////////
// Customs creation //
//////////////////////

function createCustomCombination(bitNames: string[]) {
    let dialog = document.getElementById("comboDialog") as HTMLDialogElement;
    let comboTitle = document.getElementById("comboTitle") as HTMLElement;
    comboTitle.innerHTML = bitNames.join(" + ");
    customsData.combo.ingredients = bitNames;
    dialog.showModal();
}

function createCustomBit(name: string) {
    let dialog = document.getElementById("elementDialog") as HTMLDialogElement;
    let title = document.getElementById("elementTitle") as HTMLElement;
    title.innerHTML = `Creating "${name}":`;
    customsData.bit.name = name;
    dialog.showModal();
}



(document.getElementById("submitCombo") as HTMLElement).addEventListener("click", e => {
    let result = document.getElementById("resultName") as HTMLInputElement;
    // Split multiple bit results with plus signs
    let bitNames = result.value.split("+");
    result.value = "";
    combinations.push(new Combination(customsData.combo.ingredients, bitNames));
    if (ENABLE_CUSTOMS) {
        // TODO: ASYNC EVERYTHING
        for (let bitName of bitNames) {
            // if (doesBitExist(bitName) == false) ???
        }
    }
});

(document.getElementById("submitElement") as HTMLElement).addEventListener("click", e => {
    let boxColor = document.getElementById("boxColor") as HTMLInputElement;
    let textColor = document.getElementById("textColor") as HTMLInputElement;
    possibleBits.push(customsData.bit);
    boxColor.value = "#999999";
    textColor.value = "#000000";
});

// For retrieving customs from the command line
function getComboArray() {
    return combinations.map(combo => combo.asTemplate());
}

// Exact same format as should be in bits.json
function getCurrentGameRules() {
    return {
        bits: possibleBits,
        combinations: getComboArray()
    }
}



// Driver code

populateLists();

// 4 base elements
const water = Bit.fromName("water");
const air = Bit.fromName("air");
const earth = Bit.fromName("earth");
const fire = Bit.fromName("fire");

if (water) water.setPosition(10, 10);
if (air) air.setPosition(100, 10);
if (earth) earth.setPosition(190, 10);
if (fire) fire.setPosition(280, 10);
