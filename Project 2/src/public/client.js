const initialState = Immutable.Map({
    user: {name: 'Student'},
    apod: false,
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    selectedRover: null,
    manifests: [],
    sol: 1,
    images: [],
    firstRun: true,
    selectedImage: {},
    solChange: false,
})
const store = initialState.toObject()

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState, renderPage) => {
    store = Object.assign(store, newState)
    if (renderPage === undefined) {
        render(root, store)
    }
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

// create content
const App = state => {
    const {rovers, selectedRover} = state
    if (selectedRover != null) {
        return Dashboard(selectedRover)
    }
    return RoverSelection(rovers)
}

// ------------------------------------------------------  LISTENERS
// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS

const RoverSelection = welcome => {
    let welcomeMessage = `
        ${generateStars}
        <div class="welcome">
            <h3>Rover selection</h3>
            <p>Select a Rover to continue.</p>
        </div>
    `
    if (!welcome) {
        welcomeMessage = ''
    } else {
        // Get images on first run
        if (store.firstRun) {
            console.log('Getting images, first run...')
            getImagesPerSol(store)
        }
    }
    return `
    <section>
        ${welcomeMessage}
        <div id='rover-select'>
            ${store.rovers.reduce((acum, currentVal, index, array) => {
                if (index === 1) {
                    acum = `<button class='rover' onclick="updateRoverSelection('${
                        array[index - 1]
                    }')" id=${array[index - 1].toLowerCase()}>${
                        array[index - 1]
                    }</button>`
                }
                return (
                    acum +
                    `<button class='rover' onclick="updateRoverSelection('${
                        array[index]
                    }')" id=${array[index].toLowerCase()}>${
                        array[index]
                    }</button>`
                )
            })}
        </div>
    </section>
    `
}

const Dashboard = rover => {
    const roverFilter = roverInfo => {
        return roverInfo.name === rover
    }
    const roverData = store.manifests.filter(roverFilter)[0]
    if (roverData === undefined) {
        return
    }
    return `
        ${generateStars}
        <div class="header">
            <h2>${rover}</h2>
        </div>
        <div class="sub-head">
            ${RoverSelection(false)}
        </div>
        <div class="row">
            <div class="column side">
                <button onclick="updateImageSelection('prev')" class="round">&#8249;</button>
            </div>
            <div class="column middle">
                ${renderImage(store)}
            </div>
            <div class="column side">
                <button onclick="updateImageSelection('next')" class="round">&#8250;</button>
            </div>
        </div>

        <div class="row">
            <div class="column side" style="background-color:#aaa;">
                Landing Date: ${roverData.landing_date}
            </div>
            <div class="column side" style="background-color:#ccc;">
                Launch Date: ${roverData.launch_date}
            </div>
            <div class="column side" style="background-color:#aaa;">
                Mission Status: ${roverData.status}
            </div>
            <div class="column side" style="background-color:#ccc;">
                Days on Mars: ${roverData.max_sol}
            </div>
            <div class="column side" style="background-color:#aaa;">
                Last Picture Date: ${roverData.max_date}
            </div>
            <div class="column side" style="background-color:#ccc;">
                Total Photos: ${roverData.total_photos}
            </div>
        </div>
    `
}

const renderImage = state => {
    const {images, sol, solChange, selectedImage, selectedRover} = state

    // Dont pull images again if we already have them and sol is 1
    if (selectedRover === null || selectedRover === undefined) {
        if (images.length === 0 && sol === 1) {
            getImagesPerSol(state)
        } else {
            return
        }
    } else {
        if (selectedImage[selectedRover] === undefined) {
            selectedImage[selectedRover] = {imageNumber: 0}
            updateStore(store, {selectedImage}, false)
        }
        if (solChange) {
            updateStore(store, {solChange: false}, false)
            getImagesPerSol(state)
        }
    }
    const filteredImages = images.filter(
        image => image.rover.name === selectedRover,
    )
    const image = filteredImages[selectedImage[selectedRover].imageNumber]
    const totalImages = filteredImages.length
    selectedImage[selectedRover].totalImages = totalImages
    updateStore(store, {selectedImage}, false)

    if (image === null || image === undefined) {
        return 'NO IMAGE'
    }

    return `
        <img src="${image.img_src}" height="350px" width="100%" />
        <div style="overflow-x:auto;">
            <table>
                <tr>
                    <th>Id</th>
                    <th>Sol</th>
                    <th>Earth Date</th>
                    <th>Camera</th>
                    <th>Current Image</th>
                    <th>Total Images</th>
                </tr>
                <tr>
                    <td>${image.id}</td>
                    <td>${image.sol}</td>
                    <td>${image.earth_date}</td>
                    <td>${image.camera.full_name}</td>
                    <td>${selectedImage[selectedRover].imageNumber + 1}</td>
                    <td>${totalImages}</td>
                </tr>
            </table>
        </div>
    `
}

const generateStars = (() => {
    let times = 20
    let stars = ''
    do {
        stars += '<span class="star"></span>'
        times = times - 1
    } while (times > 0)

    return `<div class="stars">${stars}</div>`
})()

// ------------------------------------------------------  FUNCTIONS

const updateRoverSelection = rover => {
    updateStore(store, {selectedRover: rover, roverChange: true})
}

const updateImageSelection = selection => {
    let {selectedImage, selectedRover, sol, solChange} = store
    let imageNumber = selectedImage[selectedRover].imageNumber
    const totalImages = selectedImage[selectedRover].totalImages
    if (selection === 'prev') {
        if (imageNumber === 0) {
            if (sol === 1) {
                return
            }
            sol -= 1
            imageNumber = 0
            solChange = true
        } else {
            imageNumber -= 1
        }
    }
    if (selection === 'next') {
        imageNumber += 1
        if (imageNumber === totalImages) {
            sol += 1
            imageNumber = 0
            solChange = true
        }
    }
    selectedImage[selectedRover].imageNumber = imageNumber
    updateStore(store, {selectedImage, sol, solChange})
}
// ------------------------------------------------------  API CALLS

const getImagesPerSol = state => {
    let {rovers, selectedRover, sol} = state
    rovers = rovers.map(rover => `rovers=${rover}`).join('&')
    fetch(
        `http://localhost:3000/sol-image?sol=${sol}&selectedRover=${selectedRover}&${rovers}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    )
        .then(res => res.json())
        .then(images => updateStore(store, {images, firstRun: false}))
}

;(function () {
    fetch('http://localhost:3000/manifests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(store),
    })
        .then(res => res.json())
        .then(manifests => updateStore(store, {manifests}))
})()
