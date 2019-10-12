let express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    Bill = require('./models/Bill'),
    User = require('./models/User'),
    auth = require('./auth')

let dotenv = require('dotenv')
dotenv.config();

let app = express(),
    port = process.env.PORT,
    mongoString = process.env.DB_STRING

mongoose.Promise = Promise

app.use(cors())
app.use(bodyParser.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
    let msg = 'hi! WydatkiPublic_2.0 are doing great! | DB: ' + mongoString
    res.send(msg)
})

app.get('/users', async (req, res) => {
    try {
        var users = await User.find({})
        res.send(users)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get('/user/:email', async (req, res) => {
    let email = req.params.email

    try {
        var user = await User.findOne({ email })
        res.send(user)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.post('/templogin', async (req, res) => {
    var loginData = req.body;
    console.log('user =>', loginData)

    var _user = await User.findOne({
        name: loginData.name
    })
    
    if(_user) {
        var _loggedIn = _user.loggedIn
        _loggedIn.push(new Date)
        _user.loggedIn = _loggedIn
        _user.save((err, newLog) => {
            console.log('success - new user saved.')
        })
    }

    console.log('_user ==>', _user)

    // if (doesn't exist) :)
    var user = new User(loginData)
    if (!_user) {
        user.save((err, newLog) => {
            console.log('success - user updated.')
        })
    }

    return res.status(200)
        .send({
            name: user.name,
            // my imple for _id
            message: `User '${user.name}' logged in.`
        })
})

app.use('/auth', auth.router)



mongoose.connect(mongoString, (err) => {
    let _name = mongoString.split('/'),
        dbName = _name[_name.length - 1]
    if (!err)
        console.log(` ===> connected to db: ${dbName} <===`)
})

// var debug = require('debug')('http'),
//     http = require('http'),
//     name = 'My App';
// debug('Hello, %s!', 'world')
// debug('booting %o', name);


app.listen(port, () => {
    console.log(` ===> server is listening at =====> port ${port}`)
});