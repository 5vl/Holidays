const axios = require("axios");
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const theCatApiKey = 'YOUR_API_KEY_HERE'
const geoIpAiKey = 'YOUR_API_KEY_HERE'
const apiNinjasKey = 'YOUR_API_KEY_HERE'

app.get('/', function(req, res) {
    res.sendfile('public/index.html');
});

app.get('/styles/style.css', function(req, res) {
    res.sendfile('public/styles/style.css');
})

app.get('/img/bg.jpg', function(req, res) {
    res.sendfile('public/img/bg.jpg');
})

io.on('connection', async (socket) => {
    socket.on('getItems', () => {
        const ip = socket.handshake.headers['x-forwarded-for']
        axios.get('https://apis.thatapicompany.com/geo-ip-api-community/locations/iplookup?ip='+ ip, {
            method: 'GET',
            headers: {
                'X-BLOBR-KEY': geoIpAiKey
            },
        }).then((data) => {
            const countryCode = data.data.country.code
            axios.get('https://api.thecatapi.com/v1/breeds').then((data) => {
                const filtered = data.data.filter((item) => {
                    return item.country_code === countryCode
                })
                if (filtered.length === 0) {
                    axios.get('https://api.thecatapi.com/v1/images/search', {
                        method: 'GET',
                        headers: {
                            'x-api-key': theCatApiKey
                        }
                    }).then((data) => {
                        const toEmit = data.data[0]
                        toEmit.is_correct_country = false
                        socket.emit('cat', toEmit)
                    })
                    return
                }
                const random = filtered[Math.floor(Math.random() * filtered.length)]
                axios.get('https://api.thecatapi.com/v1/images/search?breed_id=' + random.id, {
                    method: 'GET',
                    headers: {
                        'x-api-key': theCatApiKey
                    }
                }).then((data) => {
                    const toEmit = data.data[0]
                    toEmit.is_correct_country = true
                    socket.emit('cat', toEmit)
                })
            })
            axios.get('https://api.api-ninjas.com/v1/holidays?country=' + countryCode + '&year=' + new Date().getFullYear(), {
                method: 'GET',
                headers: {
                    'X-Api-Key': apiNinjasKey
                }
            }).then((data) => {
                socket.emit('data', data.data)
            })
        })
    })
})

server.listen(8080, function() {
    console.log(`Listening on port 8080`);
});