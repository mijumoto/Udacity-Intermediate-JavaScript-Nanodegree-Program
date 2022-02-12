// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	race_info: undefined,
	racers: undefined,
	tracks: undefined
}

const updateStore = (oldStore, newState) => {
    store = Object.assign(oldStore, newState)
/*     if (renderPage === undefined) {
        render(root, store)
    } */
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				updateStore(store, {tracks})
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				updateStore(store, {racers})
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		
		const { target, path } = event
		const parentEl = path[1]

		// Race track form field
		target.matches('.card.track') ? handleSelectTrack(target) : parentEl.matches('.card.track') ? handleSelectTrack(parentEl) : false

		// Podracer form field
		target.matches('.card.podracer') ? handleSelectPodRacer(target) : parentEl.matches('.card.podracer') ? handleSelectPodRacer(parentEl) : false

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
			let { player_id, track_id } = store
			const errorEl = document.getElementById("error")
			const playerNotAvailable = player_id === undefined
			const trackNotAvailable = track_id === undefined
			if(playerNotAvailable || trackNotAvailable) {
				errorEl.style.visibility = 'visible'
				if(playerNotAvailable && trackNotAvailable) { 
					errorEl.innerHTML = '<p>Please select a Player and a Track</p>'
				} else if(playerNotAvailable) {
					errorEl.innerHTML = '<p>Please select a Player</p>'
				} else {
					errorEl.innerHTML = '<p>Please select a Track</p>'
				}
				return
			} else {
				errorEl.style.visibility = 'hidden'
			}
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// Get player_id and track_id from the store
	let { player_id, track_id } = store

	// render starting UI
	renderAt('#race', renderRaceStartView(store))
	
	// const race = invoke the API call to create the race, then save the result
	const race = await createRace(player_id, track_id)
	race.ID = race.ID - 1
	if(race.error) return

	// update the store with the race id
	updateStore(store, { race_id: race.ID, race_info: race })

	// For the API to work properly, the race id should be race id - 1
	
	// The race has been created, now start the countdown
	// call the async function runCountdown
	const countdownRes = await runCountdown()

	// call the async function startRace
	const startRaceResponse = await startRace(race.ID)
	if(startRaceResponse.error) return

	// call the async function runRace
	await runRace(race.ID)
}

async function runRace(raceID) {
	return new Promise(resolve => {
		// use Javascript's built in setInterval method to get race info every 500ms
		async function updateRaceStatus(id) {
			const race_info = await getRace(id)
			/* 
				if the race info status property is "in-progress", update the leaderboard by calling:
			*/
			if(race_info.status === "in-progress") {
				renderAt('#leaderBoard', raceProgress(race_info.positions))
			}
	
			/* 
				if the race info status property is "finished", run the following:
			*/
			if(race_info.status === "finished") {
				clearInterval(raceInterval) // to stop the interval from repeating
				renderAt('#race', resultsView(race_info.positions)) // to render the results view
				resolve(race_info) // resolve the promise
			}
		}
		
		const raceInterval = setInterval(updateRaceStatus, 500, raceID);
		

	})
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			// use Javascript's built in setInterval method to count down once per second
			document.getElementById('big-numbers').innerHTML = timer
			const raceInterval = setInterval(function () {
				document.getElementById('big-numbers').innerHTML = --timer
				if(timer === 0) {
					clearInterval(raceInterval)
					resolve('Start!')
				}
			}, 1000, timer)
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected racer to the store
	updateStore(store, { player_id: parseInt(target.id) })
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected track id to the store
	updateStore(store, { track_id: target.id })
	
}

async function handleAccelerate() {
	console.log("accelerate button clicked")
	let { race_id } = store 
	// Invoke the API call to accelerate
	try {
		await accelerate(race_id)
	} catch (error) {
		console.error(`Error while accelerating ${error.message}`)
	}
	
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(state) {
	let { track_id, racers, tracks } = state
	let track = tracks.filter(track => track.id === parseInt(track_id))[0]
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<h1>Race Results</h1>
		${raceProgress(positions)}
		<a href="/race">Start a new race</a>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results.join("")}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// Make a fetch call (with error handling!) to each of the following API endpoints 

async function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	try {
		let res = await fetch(`${SERVER}/api/tracks`, {
			method: 'GET',
			...defaultFetchOpts(),
		})
		res = res.json()
		res.error = false
		return res
	} catch (error) {
		return { error: true, description: JSON.stringify(error) }
	}
}

async function getRacers() {
	// GET request to `${SERVER}/api/cars`
	try {
		let res = await fetch(`${SERVER}/api/cars`, {
			method: 'GET',
			...defaultFetchOpts(),
		})
		res = res.json()
		res.error = false
		return res
	} catch (error) {
		return { error: true, description: JSON.stringify(error) }
	}
}

async function createRace(player_id, track_id) {
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	try {
		let res = await fetch(`${SERVER}/api/races`, {
			method: 'POST',
			...defaultFetchOpts(),
			dataType: 'jsonp',
			body: JSON.stringify(body)
		})
		res = res.json()
		res.error = false
		return res
	} catch (error) {
		return { error: true, description: JSON.stringify(error) }
	}
}

async function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	try {
		let res = await fetch(`${SERVER}/api/races/${id}`, {
			method: 'GET',
			...defaultFetchOpts(),
		})
		res = res.json()
		updateStore(store, { race_info: res })
		res.error = false
		return res
	} catch (error) {
		return { error: true, description: JSON.stringify(error) }
	}
}

async function startRace(id) {
	try {
		let res = await fetch(`${SERVER}/api/races/${id}/start`, {
			method: 'POST',
			...defaultFetchOpts(),
		})
		res.error = false
		return res
	} catch (error) {
		return { error: true, description: JSON.stringify(error) }
	}
}

async function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	try {
		await fetch(`${SERVER}/api/races/${id}/accelerate`, {
			method: 'POST',
			...defaultFetchOpts(),
		})
	} catch (error) {
		return { error: true, description: JSON.stringify(error) }
	}
}
