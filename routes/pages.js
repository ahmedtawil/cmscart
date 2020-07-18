const router = require('express').Router()
const Pages = require('../models/Page')
router.get('/' , (req,res)=>{
    Pages.findOne({slug:"home"}).then(found=>{
        if(found) 
        res.render('index' , {content: found.content})
    
    })
    })

router.get('/:slug' , (req,res)=>{
    const slug = req.params.slug
Pages.findOne({slug:slug}).then(found=>{
    found ?
    res.render('index' , {content: found.content})
    :
    res.redirect('/')

})
})






module.exports = router