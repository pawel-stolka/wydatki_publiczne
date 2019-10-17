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
        if(_user.verified == true)
            return res
                .status(400)
                .send({
                    message: 'Real user - cannot log'
                })

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

app.post('/check/:name', auth.checkAuthenticated, async (req, res) => {
    let name = req.params.name

    try {
        var user = await User.findOne({ name })
        res.send(user)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get('/bills/:user', auth.checkAuthenticated, async (req, res) => {
    let user = req.params.user
    try {
        var bills = await Bill.find({username: user}, '-__v')
        // var users = await User.find({}, '-pass -__v')
        let parsedBills = bills.map(b => {
            let type = b.type.replace(' ', '_')//'\u00a0')// String.fromCharCode(160))
            let res = {
                _id: b._id,
                username: b.username,
                name: b.name,
                type,
                price: b.price,
                date: b.date,
                createdAt: b.createdAt
            }
            return res
        })
        // console.log('...bills', parsedBills)
        res.send(parsedBills)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get('/billsByYear/:user', async (req, res) => {
    let user = req.params.user
    let types = await Bill.aggregate([
        { $match: { username: user } },
        {
            $project: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                day: { $dayOfMonth: "$date" },
            }
        },
        {
            $group: {
                _id: {
                    year: '$year',
                },
                count: {
                    $sum: 1
                },
              }
        }
    ])
    
    let result = types.map(x => ({
        year: x._id.year,
        count: x.count
    }))

    return res.status(200)
        .send(result)
})

app.get('/type', async (req, res) => {
    let types = await Bill.aggregate([{
        $group: {
            _id: '$type',
            count: {
                $sum: 1
            },
            entry: {
                $push: {
                    username: '$username',
                    name: "$name",
                    price: "$price",
                }
            }
        }
    }])
    let typesParsed = types.map(x => {
        let id = x._id//.split(' ')
            .replace(' ', '_')
        
        let res = {
            _id: id,
            count: x.count,
            entry: x.entry
        }
        return res
    })
    // console.log('---types---', typesParsed)
    return res.status(200)
        .send(typesParsed)
})

app.post('/bill', async (req, res) => {
    var billData = req.body;
    console.log(billData)
    if (billData.price == '' ||
        billData.date == '' ||
        billData.type == null ||
        billData.price == null ||
        billData.date == null ||
        billData.type == '')
        return res.status(400)
            .send({
                message: 'not enough data...',
                details: billData
            })

    var exist = await Bill.find({
        username: billData.username,
        name: billData.name,
        price: billData.price,
        date: billData.date
    }, '-__v')
    console.log(exist)

    if (exist.length > 0) {
        console.log('exists', exist)
        return res.status(400)
            .send({
                message: 'Already in database!',
                exist
            })
    }

    var bill = new Bill(billData)
    console.log('...>>> bill', bill)
    bill.save((err, result) => {
        if (err) {
            console.error(`ERROR: ${err}`)
            return res.status(401)
                .send({
                    message: 'Could not save the bill...'
                })
        }
        return res.status(200)
            .send(billData)
    })
})

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