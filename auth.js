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
    // PORT = process.env.PORT,
    // SERVER_URL = process.env.SERVER_URL,
    FRONT_URL = process.env.FRONT_URL,
    MAIL_USER = process.env.MAIL_USER,
    MAIL_PASS = process.env.MAIL_PASS


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

        // the same secret as in encode!!!!!!!!!!!!!!!!!!!!
        var payload = jwt.decode(token, SECRET)

        if (!payload)
            return res.status(401).send({
                message: 'Unauthorized. Auth Header Invalid.'
            })

        req.userId = payload.sub

        next()
    }
}

module.exports = auth