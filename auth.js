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
    HOST = process.env.HOST,
    MAIL_USER = process.env.MAIL_USER,
    MAIL_PASS = process.env.MAIL_PASS,
    DEMOUSER = process.env.DEMOUSER


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
    // console.log('***user***', user)

    user.temporaryToken = jwt.encode({
        sub: user._id
    }, SECRET)
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

        var result = Webio(webio)

        res.status(result.status)
            .send(result.message)
    })
})

router.post('/login', auth.checkAuthenticated, async (req, res) => {
    var loginData = req.body;
    var user = await User.findOne({
        email: loginData.email
    })
    // console.log('-----login....user', user)
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
        var token = jwt.encode(payload, SECRET)
        return res.status(200)
        .send({
            token,
            // my imple for _id
            id: user._id,
            name: user.name,
            message: 'Voila! You are logged in :)'
        })
    })
})


//#region FUNCTIONS
function Webio(mailData, res) {
    let appName = 'Wydatki',
        receivers = [ mailData.email, MAIL_USER ],
        activationLink = `${FRONT_URL}/activate/${mailData.temporaryToken}`

        
    let contentHTML = `
        <h2>Hello ${mailData.name}!</h2>
        <br>
        Thank you for registering at <b>"${appName}"</b> :)
        <br>
        <br>
        Please click on the link below to complete your activation: 
        <br>
        <a href="${activationLink}">Activate</a>
        <p> Pablo from "${appName}" </p>
    `
    console.log('____activationLink____', activationLink, contentHTML)
    let email = {
        from: MAIL_USER,
        to: receivers,
        subject: 'Activation Link',
        html: contentHTML
    }

    let transporter = nodeMailer.createTransport({
        host: HOST,
        secure: false,
        auth: {
            user: MAIL_USER,
            pass: MAIL_PASS
        }
    });
    
    let result = {
        status: 400,
        message: "nope...",
        info: '-'
    }
    transporter.sendMail(email, (error, info) => {
        if (error) {
            return result
        }
        result.info = info.response
    });

    result.status = 200
    result.message = `Message sent: ${result.info}`
    result.message = `Account created! Please check your e-mail for activation link.`

    return result
}
//#endregion



module.exports = auth