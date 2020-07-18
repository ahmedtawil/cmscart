const express = require('express')
const path = require('path')
const mongoose = require('mongoose');
const config = require('./config/db')
const session = require('express-session')
const validator = require('express-validator')
const filesUploader = require('express-fileupload');
mongoose.connect(config.dbKey, {useNewUrlParser: true , useUnifiedTopology: true} );
const Pages = require('./models/Page')
const Category = require('./models/Category')

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to db');
  
});
const app = express()



app.use(express.static('public'))
app.use(filesUploader())
app.use(express.urlencoded({extended:true}))
app.set('view engine' , 'ejs')
app.locals.content = null

Pages.find((err , pageSdata)=>{
  app.locals.pages = pageSdata
  Category.find((err , categoryData)=>{
    app.locals.categories = categoryData
  })
})

// setup sessions 

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))

  // setup messages
app.use(require('connect-flash')());
app.use( (req, res, next)=> {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

  //Routes
app.use('/admin/pages' , require('./routes/admin-pages'))
app.use('/admin/categories' , require('./routes/admin-categories'))
app.use('/admin/products' , require('./routes/admin-products'))
app.use('/products' , require('./routes/all_products'))
app.use('/' , require('./routes/pages'))


const PORT = 3000;

app.listen(PORT , ()=>{
    console.log('connected to port');
    
})