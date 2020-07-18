const mongosse = require('mongoose')

const PageSchema = new mongosse.Schema({
    title:{
        type:String,
        required:true
    },
    slug:{
        type:String
    },
    content:{
        type:String,
        required:true
    },
    sorting:{
        type:String,
        required:true
    }
})

module.exports = mongosse.model('Page' , PageSchema);