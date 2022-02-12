    //Fetch data from json
    const getDinoData = async () => {
        let fetchedData = null;
        try {
            fetchedData = await fetch("./dino.json");
        } catch (error) {
            fetchedData = await fetch("https://raw.githubusercontent.com/mijumoto/Udacity-Intermediate-JavaScript-Nanodegree-Program/main/Project%201/dino.json");
        }
        const data = await fetchedData.json();
        return data.Dinos;
    };

    // Create Dino Constructor
    function Dino(data) {
        this.species = data.species;
        this.name = data.species;
        this.weight = data.weight;
        this.height = data.height;
        this.diet = data.diet;
        this.where = data.where;
        this.when = data.when;
        this.image = data.image;
        this.fact = data.fact;
        this.facts = [
            data.fact,
            `The ${data.species} is originally from the ${data.where} region.`,
            `The ${data.species} first appeared on the ${data.when} era.`,
            `The ${data.species} diet was ${data.diet}.`
        ]
        this.randomFact = function generateFact() {
            return function(data) {
                return data.species !== 'Pigeon' ?
                data.facts[Math.abs(Math.round(Math.random() * data.facts.length - 1))] :
                data.fact
            }
        }
    }

    // Create Dino Objects
    const createDinoObjects = async () => {
        const dinoData = await getDinoData();
        let dinoDataShuffled = dinoData
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
        const dinoObjects = [];
        dinoDataShuffled.forEach(dino => {
            dinoObjects.push(new Dino(dino));
        });
        return dinoObjects;
    };

    // Create Human Object
    const Human = (data) => {
        return {
            species: data.name,
            name: data.name,
            weight: data.weight,
            height: (data.feet * 12) + parseInt(data.inches),
            diet: data.diet.toLowerCase(),
            randomFact: '',
            image: 'human.png'
        }
    };

    // Create Dino Compare Method 1
    // NOTE: Weight in JSON file is in lbs, height in inches. 
    const comparisons = (objects) => {
        const { dino, human } = objects;
        const division = (a, b) => Math.round((a / b) * 100) / 100;
        const comparisonStatement = (a, b, metric) => `${a.species}'s ${metric} is ${division(a[metric], b[metric])} times bigger than the ${metric} of ${b.name}`
        const compareNumbers = (metric) => {
            const result = dino[metric] > human[metric] ? comparisonStatement(dino, human, metric) : 
                dino[metric] < human[metric] ?  comparisonStatement(human, dino, metric) :
                dino[metric] === human[metric] ? `The ${dino.species} has the same ${metric} as ${human.name} (human)` : 'Error in comparison'
            return result
        }
        const compareText = (metric) => {
            return dino[metric] === human[metric] ? `Both ${dino.species} and ${human.name} have the same diet, ${dino.diet}.` : 
            `The ${dino.species} species is ${dino.diet} while ${human.name} (human) is ${human.diet}.`
        }
        return {
            Height: compareNumbers('height'),
            Weight: compareNumbers('weight'),
            Diets: compareText('diet')
        }
    }

    // use mixin to expand the list of facts
    const getAllObjects = async () => {
        // Use IIFE to get human data from form
        const human = (Human)(getFieldValues());
        const dinoObjects = await createDinoObjects();
        const allObjects = [];
        dinoObjects.forEach( (dino, index) => {
            const compare = comparisons({ dino, human })
            dino.facts = dino.facts.concat([
                compare.Height, 
                compare.Weight, 
                compare.Diets
            ])
            dino.randomFact = dino.randomFact()(dino);
            if(index === 4) {
                allObjects.push(human)
            }
            allObjects.push(dino)
        })
        return allObjects;
    }
    
    // Generate Tiles for each Dino in Array
    const generateTiles = async () => {
        const allObjects = await getAllObjects();
        let gridItems = '';
        allObjects.forEach(obj => {
            gridItems += `<div class="grid-item">
            <h3>${obj.species}</h3>
            <img src="./images/${obj.image}">
            <p>${obj.randomFact}</p>
            </div>`
        })
        return gridItems;
    }

// On button click, prepare and display infographic
function getFieldValues() {
    return {
        name: document.getElementById('name').value,
        feet: document.getElementById('feet').value,
        inches: document.getElementById('inches').value,
        weight: document.getElementById('weight').value,
        diet: document.getElementById('diet').value
    }
}

function validateFields(fieldValues) {
    let errors = '<p>Please fix the following errors:</p><ul>';
    let hasErrors = false;
    Object.values(fieldValues).forEach( (value, index) => {
        if(value.trim() === '') {
            hasErrors = true;
            errors += `<li>${Object.keys(fieldValues)[index]} is empty</li>`;
        }
    });
    errors += '</ul>'
    return {
        hasErrors,
        errors
    }
}

function showInfoGraph(){
    form.classList.add("hidden");
    grid.classList.remove("hidden");
}

async function validateForm(event) {
    await event.preventDefault();
    const fieldValues = getFieldValues();
    const fieldValidationErrors = validateFields(fieldValues);
    if(fieldValidationErrors.hasErrors) {
        log.innerHTML = fieldValidationErrors.errors; 
    } else {
        const tiles = await generateTiles();
        gridContainer.innerHTML = tiles;
        showInfoGraph();
    }
}

function resetErrors() {
    log.textContent = '';
}
 
const form = document.getElementById('dino-compare');
const grid = document.getElementById('grid');
const gridContainer = document.getElementById('grid-container');
const log = document.getElementById('error-msg');
const regenButton = document.getElementById('regen-button');
resetErrors();
form.addEventListener('submit', validateForm);
regenButton.addEventListener('click', validateForm);