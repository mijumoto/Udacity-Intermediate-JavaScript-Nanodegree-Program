require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const axios = require('axios')
const app = express()
const port = 3000
const apiKey = `api_key=${process.env.API_KEY}`

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// Returns all three rover sol=1 images if SelectedRover is null or undefined
// Returns SelectedRover images for given sol
// Returns error if sol is not provided
app.get('/sol-image', async (req, res) => {
    console.log('Images call')
    let {sol, selectedRover, rovers} = req.query
    selectedRover = 'null' // pull all rovers by sol by default
    console.log(req.query)
    rovers = rovers.map(rover => rover.toLowerCase())
    const baseUrl = 'https://api.nasa.gov/mars-photos/api/v1/rovers/'
    if (sol === undefined) {
        res.send({error: 'sol is missing'})
    }
    try {
        let response = null
        let data = null
        if (selectedRover === 'null' || selectedRover === undefined) {
            console.log('Pull All Rovers')
            response = await Promise.all([
                axios.get(`${baseUrl}${rovers[0]}/photos?sol=${sol}&${apiKey}`),
                axios.get(`${baseUrl}${rovers[1]}/photos?sol=${sol}&${apiKey}`),
                axios.get(`${baseUrl}${rovers[2]}/photos?sol=${sol}&${apiKey}`),
            ])
            data = response
                .map(res => {
                    res = res.data.photos
                    return res
                })
                .flat()
        } else {
            console.log(`Pulling rover data for ${selectedRover}`)
            response = await axios.get(
                `${baseUrl}${selectedRover.toLowerCase()}/photos?sol=${sol}&${apiKey}`,
            )
            data = response.data.photos
        }
        res.send([...data])
    } catch (err) {
        console.log('error:', err)
    }
})

// Returns the manifest for all three rovers
app.post('/manifests', async (req, res) => {
    console.log('Manifests call')
    const baseUrl = 'https://api.nasa.gov/mars-photos/api/v1/manifests/'
    const rovers = req.body.rovers.map(rover => rover.toLowerCase())

    try {
        const response = await Promise.all([
            axios.get(`${baseUrl}${rovers[0]}?${apiKey}`),
            axios.get(`${baseUrl}${rovers[1]}?${apiKey}`),
            axios.get(`${baseUrl}${rovers[2]}?${apiKey}`),
        ])
        const data = response.map(res => {
            res = res.data.photo_manifest
            return res
        })
        res.send([...data])
    } catch (err) {
        console.log('error:', err)
    }
})

app.listen(port, () => console.log(`Server listening on port ${port}!`))
