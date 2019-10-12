var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs')

var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    pass: String,
    plainPass: String,
    verified: {
        type: Boolean,
        default: false
    },
    loggedIn: {
        type: Array,
        default: []
    },
    notLoggedIn: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    loggedIn: {
        type: Array,
        default: []
    },
    temporaryToken: String
})

userSchema.pre('save', function(next) {
    var user = this,
    salt = null,
    counter = 1,
    progress = (err, progress) => {
        process.stdout.write(`. `);
        counter++;
    }

    // means: if password is different
    if (!user.isModified('pass'))
        return next()

    bcrypt.hash(user.pass, salt, progress, (err, hash) => {
        if(err) return next(err)

        console.log(counter)
        user.pass = hash
        next()
    })
})

module.exports = mongoose.model('User', userSchema)