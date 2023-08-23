export { }
// Main HTML area used for the game
var gameArea: HTMLDivElement = document.getElementById("gamearea") as HTMLDivElement;
// List of bits that currently exist in gameArea
var bitList: Bit[] = [];

// Object to keep track of dragging and key state.
var userIn = {
    dragThreshold: 3,
    dragging: false,
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

var customsEnabled = false;
var aiEnabled = true;

// List of every type of bit
var possibleBits: BitTemplate[] = [];
// List of every possible combination
var combinations: Combination[] = [];
// List of BASE bits - The ones that never leave.
var baseBits: Bit[] = [];

interface BitTemplate {
    name: string;
    color: string;
    textColor: string;
}

interface Combination {
    ingredients: string[];
    results: string[];
}

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

    static fromTemplate(template: BitTemplate, isBase: boolean = false) {
        return new Bit(template.name, template.color, template.textColor, isBase);
    }

    static fromName(bitName: string, isBase: boolean = false): Bit | null {
        const template = possibleBits.find(template => template.name == bitName);
        return template ? Bit.fromTemplate(template, isBase) : null;
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
        return this.element.getBoundingClientRect();
    }

    initElement(area: HTMLDivElement) {
        this.element.appendChild(document.createTextNode(this.name));
        this.element.classList.add("element");
        this.element.style.background = this.color;
        this.element.style.color = this.textColor;
        if (this.isBase) this.element.classList.add("base");
        area.appendChild(this.element);

        // Dragging on left click
        // Deleting on right click
        this.element.addEventListener("mousedown", e => {
            if (e.button == 0) {
                // Left mouse button
                userIn.bit.bit = this;

            }
            else if (e.button == 2) {
                // Right mouse button
                // Deletes the bit
                if (this.isBase == false) {
                    this.remove();
                }
            }
        });

        // Pin/toggle isBase on double click
        this.element.addEventListener("dblclick", e => {
            console.log("dblclick")
            if (e.button == 0) {
                console.log("l")
                // Left click toggles isBase
                this.toggleBase();
            }
        })
    }

    // removes from list and DOM
    remove() {
        let index = bitList.indexOf(this);
        if (index > -1) bitList.splice(index, 1);
        this.element.remove();
    }

    hide() {
        this.element.style.display = "none";
    }

    show() {
        this.element.style.display = "flex";
    }

    putOnTop() {
        // Put on top in DOM
        gameArea.insertBefore(this.element, null);
        // Remove and put on top of elementList
        let index = bitList.indexOf(this);
        if (index > -1) bitList.splice(index, 1);
        bitList.push(this);
    }

    toggleBase() {
        this.isBase = !this.isBase;
        if (this.isBase) {
            this.element.classList.add("base");
        } else {
            this.element.classList.remove("base");
        }
    }

    setGrabbingCursor(enabled: boolean) {
        if (enabled) this.element.classList.add("grabbing");
        else this.element.classList.remove("grabbing");
    }

    setInteractionCursor(enabled: boolean) {
        if (enabled) this.element.classList.add("interaction");
        else this.element.classList.remove("interaction");
    }
}

function getRectOverlap(rect1: DOMRect, rect2: DOMRect) {
    let vertOverlap = Math.max(0, Math.min(rect1.bottom - rect2.top, rect2.bottom - rect1.top));
    let horiOverlap = Math.max(0, Math.min(rect1.right - rect2.left, rect2.right - rect1.left));
    let overlapArea = vertOverlap * horiOverlap;
    return overlapArea;
}


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
    // TODO: Pass in an ordered list of overlapping elements or something to enable 3+ bit combos
    if (overlapBit != null) combineBits([bit, overlapBit]);
}

function isOverlappingAnyBit(bit: Bit): boolean {
    let rect1 = bit.getRect();
    for (let secondBit of bitList) {
        if (secondBit == bit) continue;
        let rect2 = secondBit.getRect();
        if (getRectOverlap(rect1, rect2) > 0) return true;
    }
    return false;
}

function combineBits(bits: Bit[]) {
    if (bits.length < 2) return;
    const bitNames = bits.map(bit => bit.name);
    const rectList = bits.map(bit => bit.getRect());
    const results = getCombinationResult(bitNames);
    if (results.length != 0) {
        const points = getPointsAbout(rectList, results.length);
        for (let bit of bits) if (!bit.isBase) bit.remove();
        // Space out multiple combo results
        for (let i = 0; i < results.length; i++) {
            results[i].setPosition(points[i].left, points[i].top);
        }
    } else if (customsEnabled) {
        // Make custom bit
        const midpoint = getMidpoint(rectList);
        for (let bit of bits) if (!bit.isBase) bit.hide();
        showCustomBitMaker(midpoint.left, midpoint.top, (results: Bit[]) => {
            if (results.length != 0) {
                // Make the custom combo
                combinations.push({
                    ingredients: bits.map(bit => bit.name),
                    results: results.map(bit => bit.name)
                });
                const points = getPointsAbout(rectList, results.length);
                for (let bit of bits) if (!bit.isBase) bit.remove();
                // Space out multiple combo results
                for (let i = 0; i < results.length; i++) {
                    results[i].setPosition(points[i].left, points[i].top);
                }
            } else {
                for (let bit of bits) if (!bit.isBase) bit.show();
            }
        });
    } else if (aiEnabled) {
        const midpoint = getMidpoint(rectList);
        for (let bit of bits) if (!bit.isBase) bit.hide();
        getGeneratedCombinationResult(bits.map(bit => bit.name), (bitResult: string) => {
            if (bitResult == "Failure") {
                for (let bit of bits) if (!bit.isBase) bit.show();
            } else {

                getGeneratedColorResult(bitResult, (colorResult: string) => {
                    if (doesBitExist(bitResult) == false) {
                        possibleBits.push({
                            name: bitResult,
                            color: colorResult,
                            textColor: getDefaultTextColor(colorResult)
                        });
                    }
                    const newBit = Bit.fromName(bitResult);
                    newBit?.setPosition(midpoint.left, midpoint.top);
                });

                // Make the custom combo
                combinations.push({
                    ingredients: bits.map(bit => bit.name),
                    results: [bitResult]
                });
                const points = getPointsAbout(rectList, results.length);
                for (let bit of bits) if (!bit.isBase) bit.remove();
                // Space out multiple combo results
                for (let i = 0; i < results.length; i++) {
                    results[i].setPosition(points[i].left, points[i].top);
                }
            }
        });
        // TODO
    }
}

function hexToRGB(hexColor: string) {
    if (hexColor.at(0) == '#') hexColor = hexColor.slice(1);
    const r = parseInt(hexColor.slice(0, 2), 16);
    const g = parseInt(hexColor.slice(2, 4), 16);
    const b = parseInt(hexColor.slice(4, 6), 16);
    return { r: r, g: g, b: b };
}

function getDefaultTextColor(hexColor: string) {
    const rgb = hexToRGB(hexColor);
    if ((rgb.r + rgb.g + rgb.b)/3 < 255/2) {
        // hexColor is less than half bright
        return "#FFFFFF";
    } else {
        // hexColor is more than half bright
        return "#000000";
    }
}

function getMidpoint(rects: DOMRect[]) {
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

// For spawning multiple bits not directly on top of each other
function getPointsAbout(rects: DOMRect[], numberOfPoints: number): { top: number, left: number }[] {
    if (rects.length == 0) return [];
    if (numberOfPoints < 2) return [getMidpoint(rects)]
    let topmost = null as number | null, bottommost = null as number | null;
    let leftmost = null as number | null, rightmost = null as number | null;
    for (let rect of rects) {
        if (topmost == null || rect.top < topmost) topmost = rect.top;
        if (bottommost == null || rect.top > bottommost) bottommost = rect.top;
        if (leftmost == null || rect.left < leftmost) leftmost = rect.left;
        if (rightmost == null || rect.left > rightmost) rightmost = rect.left;
    }
    topmost ??= 0, bottommost ??= 0, leftmost ??= 0, rightmost ??= 0;
    const verticalInterval = (bottommost - topmost) / (numberOfPoints - 1);
    const horizontalInterval = (rightmost - leftmost) / (numberOfPoints - 1);

    let results: { top: number, left: number }[] = [];
    for (let i = 0; i < numberOfPoints; i++) {
        results.push({
            top: topmost + verticalInterval * i,
            left: leftmost + horizontalInterval * i
        });
    }

    return results;
}


document.addEventListener("mousedown", e => {
    if (e.button == 0) {
        // Left mouse button
        userIn.mouse.down = true;
        userIn.mouse.x = e.pageX;
        userIn.mouse.y = e.pageY;
    }
});

document.addEventListener("mouseup", e => {
    // TODO: Put dragged element on end of elementList
    // to mirror gameArea child order
    if (e.button == 0) {
        // Left mouse button
        if (userIn.dragging) {
            userIn.dragging = false;
            if (userIn.bit.bit != null) {
                userIn.bit.bit.setGrabbingCursor(false);
                userIn.bit.bit.setInteractionCursor(false);
                findOverlap(userIn.bit.bit);
            }
        }
        userIn.mouse.down = false;
        userIn.bit.element = null;
        userIn.bit.bit = null;
        userIn.mouse.x = 0;
        userIn.mouse.y = 0;
    }
});

document.addEventListener("mousemove", e => {
    if (userIn.mouse.down && userIn.bit.bit && userIn.dragging) {
        let dx = e.pageX - userIn.mouse.x;
        let dy = e.pageY - userIn.mouse.y;
        userIn.bit.bit.setPosition(userIn.bit.x + dx, userIn.bit.y + dy);
        const overlapping = isOverlappingAnyBit(userIn.bit.bit);
        if (overlapping) userIn.bit.bit.setInteractionCursor(true);
        else userIn.bit.bit.setInteractionCursor(false);
    }
    else if (userIn.mouse.down && userIn.dragging == false) {
        const dx = Math.abs(e.pageX - userIn.mouse.x);
        const dy = Math.abs(e.pageY - userIn.mouse.y);
        if (dx >= userIn.dragThreshold || dy >= userIn.dragThreshold) {
            userIn.dragging = true;
            if (userIn.bit.bit == null) return;
            let targetBit: Bit;
            // Copy when is "base" or holding shift
            if (userIn.bit.bit.isBase || e.shiftKey) targetBit = userIn.bit.bit.spawnCopy();
            else targetBit = userIn.bit.bit;

            userIn.bit.bit = targetBit;
            userIn.bit.element = targetBit.element;
            let rect = targetBit.getRect()
            userIn.bit.x = rect.left;
            userIn.bit.y = rect.top;
            // Make element TOP on z
            targetBit.putOnTop();
            targetBit.setGrabbingCursor(true);
        }
    }
});

// Disable context menu on right clicking.
// I wanted to add this only for the bits
// But the mouseevent is first and I don't want
// to tie removing bits to the functioning of the context menu.
// (i.e. i'm lazy)
document.addEventListener("contextmenu", e => {
    e.preventDefault();
    e.stopPropagation();
})

function matchCombo(combo: Combination, bitNames: string[]): boolean {
    if (bitNames.length != combo.ingredients.length) return false;
    bitNames.sort();
    combo.ingredients.sort();
    for (let i = 0; i < bitNames.length; i++) {
        if (bitNames[i].toLowerCase() != combo.ingredients[i].toLowerCase()) return false;
    }
    return true;
}

function getCombinationResult(bitNames: string[]): Bit[] {
    const foundCombo = combinations.find(combo => matchCombo(combo, bitNames));
    if (foundCombo) return foundCombo.results.map(bit => Bit.fromName(bit)).filter(bit => bit) as Bit[];
    return [];
}

function doesBitExist(bitName: string) {
    return possibleBits.some(template => template.name.toLowerCase() == bitName.toLowerCase());
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

// Fill possibleBits, combinations, and initializes baseBits
function populateLists(filename: string = "bits.json") {
    console.log("Requesting combinations...");
    getJSONFromFile(filename, (file: any) => {
        console.log("Recieved! Applying combinations...");
        loadFromJSON(file);
        console.log("Loaded!");
    })
}

function loadFromJSON(json: { baseBits: string[], bits: BitTemplate[], combinations: Combination[] }) {
    possibleBits = json.bits;
    combinations = json.combinations;
    initBaseBits(json.baseBits);
}
// inits baseBits with a list of names.
// Be sure these exist in the possibleBits list.
function initBaseBits(baseBitNames: string[]) {
    let pos = 10;
    for (let name of baseBitNames) {
        const newBit = Bit.fromName(name, true);
        if (newBit) {
            newBit.setPosition(10, pos);
            baseBits.push(newBit);
            pos += 90;
        }
    }
}



///////////////////////////
// Customs functionality //
///////////////////////////

// Background color
const cPicker1 = document.getElementById("color-picker-1") as HTMLInputElement;
// Text color
const cPicker2 = document.getElementById("color-picker-2") as HTMLInputElement;
// input text
const customBitName = document.getElementById("bit-name") as HTMLInputElement;
// Bit element div
const customBit = document.getElementById("custom-bit") as HTMLDivElement;
const customSubmit = document.getElementById("submit-custom") as HTMLButtonElement;
const customContainer = document.getElementById("custom-container") as HTMLDivElement;
var customSubmitCallback: Function | null = null;

// Background color
cPicker1.addEventListener("input", e => {
    customBit.style.background = cPicker1.value;
});

// Text color
cPicker2.addEventListener("input", e => {
    customBit.style.color = cPicker2.value;
    customBitName.style.color = cPicker2.value;
});

// Submit button
customSubmit.addEventListener("click", e => {
    const name = customBitName.value.trim();
    if (name == "") {
        hideCustomBitMaker();
        if (customSubmitCallback) customSubmitCallback([]);
        return;
    }
    if (doesBitExist(name) == false) {
        const color = cPicker1.value.trim();
        const textColor = cPicker2.value.trim();
        possibleBits.push({
            name: name,
            color: color,
            textColor: textColor
        });
    }
    const newBit = Bit.fromName(name);
    if (newBit == null) {
        console.log("ERROR: New bit returned null");
        return;
    }
    const customRect = customBit.getBoundingClientRect();
    newBit.setPosition(customRect.left, customRect.top);
    if (customSubmitCallback) customSubmitCallback([newBit]);
    hideCustomBitMaker();
});

function showCustomBitMaker(left: number, top: number, callback: Function) {
    customContainer.style["top"] = `${top}px`;
    customContainer.style["left"] = `${left}px`;
    customContainer.style.display = "flex";

    customSubmitCallback = callback;
}

function hideCustomBitMaker() {
    cPicker1.value = "#AAAAAA";
    cPicker2.value = "#000000";
    customBitName.value = "";
    customContainer.style.display = "none";
    // Update colors
    customBit.style.background = cPicker1.value;
    customBit.style.color = cPicker2.value;
    customBitName.style.color = cPicker2.value;
}

function exportJSON() {
    const newFile = {
        baseBits: baseBits.map(bit => bit.name),
        bits: possibleBits,
        combinations: combinations
    };
    console.log(newFile);
}

///////
// AI functionality
/////////////

function getGeneratedCombinationResult(bits: string[], callback: Function) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var result = this.responseText;
            callback(result);
        }
    };
    xmlhttp.open("GET", "gencombo/" + bits.join("/"), false);
    xmlhttp.send();
}

function getGeneratedColorResult(bit: string, callback: Function) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var result = this.responseText;
            callback(result);
        }
    };
    xmlhttp.open("GET", "gencolor/" + bit, false);
    xmlhttp.send();
}

// Driver code

hideCustomBitMaker();
populateLists();
