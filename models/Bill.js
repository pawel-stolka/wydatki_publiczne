var mongoose = require('mongoose'),
    moment = require('moment')

var billSchema = new mongoose.Schema({
    username: String,
    name: String,
    price: Number,
    currency: String,
    date: {
        type: Date,
        default: Date.now
    },
    type: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

billSchema.pre('save', function(next) {
    var _bill = this
    _bill.date = moment(_bill.date)
        .utc()
        //adds 2 hours
        .add(2, 'h')

    next()
})

module.exports = mongoose.model('Bill', billSchema)