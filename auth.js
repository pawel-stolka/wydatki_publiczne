let cors = require('cors'),
    User = require('./models/User'),
    Bill = require('./models/Bill'),
    jwt = require('jwt-simple'),
    bcrypt = require('bcrypt-nodejs'),
    express = require('express'),
    router = express.Router(),
    nodeMailer = require('nodemailer')

let dotenv = require('dotenv')
dotenv.config();

let SECRET = process.env.SECRET,
    FRONT_URL = process.env.FRONT_URL,
    MAIL_USER = process.env.MAIL_USER,
    MAIL_PASS = process.env.MAIL_PASS,
    DEMOUSER = 'demoUser'


router.use(cors())

var auth = {
    router,
    checkAuthenticated: (req, res, next) => {
        
        if (!req.header('authorization'))
            return res.status(401)
                .send({
                    message: 'Unauthorized. Missing Auth Header.'
                })
        
        var token = req.header('authorization').split(' ')[1]
        try {
            // the same secret as in encode!!!!!!!!!!!!!!!!!!!!
            var payload = jwt.decode(token, SECRET)
        } catch (error) {
            
            console.log('jwt.decode ERROR-------', token)
            if(token == 'demoUser') {
                var payload = {
                    sub: DEMOUSER
                }
                // next()
            }
        }
        
        if (!payload) {
            console.log('payload, token...')
            return res.status(401).send({
                message: 'Unauthorized. Auth Header Invalid.'
            })
        }
        req.userId = payload.sub

        next()
    }
}

router.post('/register', async (req, res) => {
    var userData = req.body;
    // todo: validation

    if (userData.email == '') {
        return res.status(401)
            .send({
                message: 'What do you want to do?'
            })
    }
    var user = new User(userData)
    console.log('***user***', user)

    user.temporaryToken = jwt.encode({
        sub: user._id
    }, 'SECRET')
    // console.log('debug', user)
    var _existing = await User.findOne({
        email: userData.email
    })

    if (_existing) {
        return res.status(401)
            .send({
                message: 'This user already exists.'
            })
    }

    user.save((err, newUser) => {
        if (err) {
            console.log(`ERROR: ${err}`)
            return res.status(401)
                .send({
                    message: 'Error saving the user...'
                })
        }

        createSendToken(res, newUser)

        let webio = {
            email: user.email,
            name: user.name,
            temporaryToken: user.temporaryToken,
        }

        console.log('webio--------newUser', newUser, webio)

        var result = webio2(webio)

        res.status(result.status)
            .send(result.message)
    })
})

router.post('/login', auth.checkAuthenticated, async (req, res) => {
    var loginData = req.body;
    console.log('-----login....loginData', loginData)
    var user = await User.findOne({
        email: loginData.email
    })
    console.log('-----login....user', user)
    console.log('-----login....loginData', loginData)
    if (!user)
        return res.status(401)
            .send({
                message: 'Email or Password invalid.'
            })

    bcrypt.compare(loginData.pass, user.pass, (err, isMatch) => {
        if (!isMatch) {
            var _notLoggedIn = user.notLoggedIn
            _notLoggedIn.push(new Date)
            user.notLoggedIn = _notLoggedIn

            user.save((err, res) => {
                console.log('false - updated notLoggedIn.')
            })

            return res.status(401)
                .send({
                    message: 'Email or Password invalid!'
                })
        }

        if (!user.verified)
            return res.status(401)
                .send({
                    message: 'Please check your email and confirm identity!',
                    verified: user.verified
                })

        // if (isMatch) :)
        var _in = user.loggedIn
        _in.push(new Date)
        user.loggedIn = _in

        user.save((err, newLog) => {
            console.log('success - updated loggedIn.')
        })

        var payload = {
            sub: user._id
        }
        console.log('##### payload SECRET! ', payload, SECRET)
        var token = jwt.encode(payload, 'SECRET')
        return res.status(200)
        .send({
            token,
            // my imple for _id
            id: user._id,
            name: user.name,
            message: 'Voila! You are logged in :)'
        })
        // let response = createSendToken(res, user)
        console.log('..__..response..', response)
    })
})






module.exports = auth