var gameArea = document.getElementById("gamearea");

var elementList = [];

var CUSTOMS = true;

class ElementBox {
    constructor(name, color, textColor, isBase = false) {
        this.name = name;
        this.color = color;
        this.textColor = textColor;
        this.el = document.createElement("div");
        this.isBase = isBase;
        this.initEl(gameArea);
        elementList.push(this);
    }

    setPosition(x, y) {
        this.el.style["top"] = `${y}px`;
        this.el.style["left"] = `${x}px`;
    }

    spawnCopy(left = null, top = null) {
        let copy_el = new ElementBox(this.name, this.color, this.textColor, false);
        if (top == null && left == null) {
            let box = this.el.getBoundingClientRect();
            copy_el.setPosition(box.left, box.top);
        } else {
            copy_el.setPosition(left, top);
        }
        return copy_el;
    }

    initEl(area) {
        this.el.appendChild(document.createTextNode(this.name));
        this.el.classList.add("element");
        this.el.style["background-color"] = this.color;
        this.el.style["color"] = this.textColor;
        area.appendChild(this.el);

        this.el.addEventListener("mousedown", e => {
            let target;
            // Copy when is "base" or holding shift
            if (this.isBase || holdingShift) target = this.spawnCopy();
            else target = this;
            dragging.element = target.el;
            dragging.elementBox = target;
            let rect = target.el.getBoundingClientRect()
            dragging.elementX = rect.left;
            dragging.elementY = rect.top;
            // Make element TOP on z
            target.putOnTop();
        })
    }

    combine(elementBox) {
        console.log("Combinging with " + elementBox.name);
        let result = getCombinationResult(this.name, elementBox.name);
        if (result != null) {
            let newPos = findMidpoint(this, elementBox);
            if (this.isBase == false) this.remove();
            if (elementBox.isBase == false) elementBox.remove();
            result.setPosition(newPos.left, newPos.top);
        }
    }

    remove() {
        let index = elementList.indexOf(this);
        if (index > -1) elementList.splice(index, 1);
        this.el.remove();
    }

    putOnTop() {
        // Put on top in DOM
        gamearea.insertBefore(this.el, null);
        // Remove and put on top of elementList
        let index = elementList.indexOf(this);
        if (index > -1) elementList.splice(index, 1);
        elementList.push(this);
    }
}

// elBox is released element.
// Finds the elements elBox overlaps.
// Gets the element most overlapped by elBox.
function findOverlap(elBox) {
    let rect1 = elBox.el.getBoundingClientRect();
    let maxOverlap = 0;
    let overlappingElement = null;
    for (let box of elementList) {
        if (box === elBox) continue;
        let rect2 = box.el.getBoundingClientRect();
        let vertOverlap = Math.max(0, Math.min(rect1.bottom - rect2.top, rect2.bottom - rect1.top));
        let horiOverlap = Math.max(0, Math.min(rect1.right - rect2.left, rect2.right - rect1.left));
        let overlapArea = vertOverlap * horiOverlap;
        if (overlapArea > 0 && overlapArea >= maxOverlap) {
            maxOverlap = overlapArea;
            overlappingElement = box;
        }
    }
    if (overlappingElement != null) elBox.combine(overlappingElement);
}

function findMidpoint(elBox1, elBox2) {
    let rect1 = elBox1.el.getBoundingClientRect();
    let rect2 = elBox2.el.getBoundingClientRect();
    let top = (rect1.top + rect2.top) / 2;
    let left = (rect1.left + rect2.left) / 2;
    return {
        top: top,
        left: left
    };
}

var dragging = {
    mouseDown: false,
    element: null,
    elementBox: null,
    clickX: 0,
    clickY: 0,
    elementX: 0,
    elementY: 0
};

var holdingShift = false;

document.addEventListener("keydown", e => {
    if (e.key == "Shift") holdingShift = true;
});

document.addEventListener("keyup", e => {
    if (e.key == "Shift") holdingShift = false;
});

document.addEventListener("mousedown", e => {
    dragging.mouseDown = true;
    dragging.clickX = e.pageX;
    dragging.clickY = e.pageY;
});

document.addEventListener("mouseup", e => {
    // TODO: Put dragged element on end of elementList
    // to mirror gameArea child order
    if (dragging.elementBox != null) findOverlap(dragging.elementBox);
    dragging.mouseDown = false;
    dragging.element = null;
    dragging.elementBox = null;
    dragging.clickX = 0;
    dragging.clickY = 0;
});

document.addEventListener("mousemove", e => {
    if (dragging.mouseDown && dragging.element) {
        let dx = e.pageX - dragging.clickX;
        let dy = e.pageY - dragging.clickY;
        dragging.elementBox.setPosition(dragging.elementX + dx, dragging.elementY + dy)
    }
});

class Combination {
    constructor(e1, e2, resultName) {
        this.e1 = e1;
        this.e2 = e2;
        this.resultName = resultName;
    }

    test(name1, name2) {
        let a1 = name1.toLowerCase(),
            a2 = name2.toLowerCase(),
            b1 = this.e1.toLowerCase(),
            b2 = this.e2.toLowerCase();
        return (a1 == b1 && a2 == b2) || (a2 == b1 && a1 == b2);
    }

    result() {
        let box = getElementFromPossible(this.resultName);
        // Error occurs if result element is not defined, misspelled, etc
        return box;
    }
}

function getElementFromPossible(name) {
    for (let el of possibleElements) {
        if (el[0].toLowerCase() == name.toLowerCase()) {
            return new ElementBox(el[0], el[1], el[2]);
        }
    }
    if (CUSTOMS) createCustomElement(name);
    return null;
}

// Returns an ElementBox or null
function getCombinationResult(name1, name2) {
    for (let combo of combinations) {
        if (combo.test(name1, name2)) return combo.result();
    }
    if (CUSTOMS) createCustomCombination(name1, name2);
    return null;
}

function getJSONFromFile(filename, callback) {
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

function populateLists() {
    console.log("Requesting combinations...");
    getJSONFromFile("elements.json", file => {
        console.log("Recieved! Applying combinations...");
        possibleElements = file.possibleElements;
        for (let combo of file.combinations) {
            combinations.push(new Combination(combo[0], combo[1], combo[2]));
        }
        console.log("Loaded!");
    })
}

function createCustomCombination(name1, name2) {
    let dialog = document.getElementById("comboDialog");
    let comboTitle = document.getElementById("comboTitle");
    comboTitle.innerHTML = `${name1} + ${name2}`;
    customCombo1 = name1;
    customCombo2 = name2;
    dialog.showModal();
}

var customElement;
var customCombo1, customCombo2;

function createCustomElement(name) {
    let dialog = document.getElementById("elementDialog");
    let title = document.getElementById("elementTitle");
    title.innerHTML = `Creating "${name}":`;
    customElement = name;
    dialog.showModal();
}

document.getElementById("submitCombo").addEventListener("click", e => {
    let result = document.getElementById("resultName");
    let elementName = result.value;
    result.value = "";
    combinations.push(new Combination(customCombo1, customCombo2, elementName));
    let el = getElementFromPossible(elementName);
    if (el) el.remove();
})

document.getElementById("submitElement").addEventListener("click", e => {
    let boxColor = document.getElementById("boxColor");
    let textColor = document.getElementById("textColor");
    possibleElements.push([customElement, boxColor.value, textColor.value]);
    boxColor.value = "#999999";
    textColor.value = "#000000";
})

var possibleElements = [];
var combinations = [];
populateLists();





// Driver code

// 4 base elements
let water = new ElementBox("Water", "#44F", "black", true);
water.setPosition(10, 10);
let air = new ElementBox("Air", "#ABF", "black", true);
air.setPosition(100, 10);
let earth = new ElementBox("Earth", "#832", "white", true);
earth.setPosition(190, 10);
let fire = new ElementBox("Fire", "#F54", "black", true);
fire.setPosition(280, 10);

