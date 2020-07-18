const router = require('express').Router()
const { check, validationResult, Result } = require('express-validator')
const mongoose = require('mongoose')

// Get category
const Category = require('../models/Category')
// Get add-category-page
let loadData = (data , req)=>{
    req.app.locals.categories = data
}
router.get('/add-category', (req, res) => {
    res.render('admin/categories/add-category', {
        title: null
    })
    
})

router.get('/', (req, res) => {
    Category.find({}, (err, categories) => {
        if (err) return console.log(err);
        res.render('admin/categories/categories', { categories })
        loadData(categories , req)

    })
})



let lowerCase = (body) => {
    let result = Object.assign(body);
    for (let prop in result) {
        result[prop] = result[prop].toLowerCase()
    }
    return result;
}


//Post add-category
router.post('/add-category', [
    check('title', 'title must have a value').notEmpty()
], (req, res) => {

    const errors = validationResult(req)

    let { title } = lowerCase(req.body)
    let slug = ''
    slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {

        res.render('admin/categories/add-category', {
            errors: errors.errors,
            title: title

        })
    } else {
        Category.findOne({ slug: slug }, (err, foundCategory) => {
            if (err) {
                return console.log(err);
            }
            if (foundCategory) {

                req.flash('danger', 'Category slug exists choose another!')
                res.render('admin/categories/add-category', {
                    title: title
                })
            } else {

                const newCategory = new Category({ title: title, slug: slug })

                newCategory.save(err => {
                    if (err) {
                        return console.log(err);
                    }
                    req.flash('success', 'new category added!')
                    res.redirect('/admin/categories')
                })
            }
        })
    }
})


// get edit-category
router.get('/edit-category/:slug', (req, res) => {
    const slug = req.params.slug
    Category.findOne({ slug: slug }, (err, category) => {
        if (err) console.log(err);
        res.render('admin/categories/edit-category', {
            title: category.title,
            slug:category.slug,
            id: category._id
        })
    })
})

// Post edit-category
router.post('/edit-category/:slug'
, [
    check('title', 'title must have a value').notEmpty()
], (req, res) => {

    const errors = validationResult(req)
    let { title, id } = lowerCase(req.body);
    id = id.trim();
    let slug = ''
    slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {

        res.render('admin/categories/edit-category', {
            errors: errors.errors,
            title: title,
            slug:slug,
            id: id
        })
    } else {
        Category.findOne({title:title} , (err , foundCategory) =>{
            if (err)
                return console.log(err);

            if (foundCategory) {
                console.log(foundCategory);
                
                req.flash('danger', 'Category slug exists choose another!')
                res.render('admin/categories/edit-category', {
                    title: title,
                    slug:slug,
                    id: id
                })
            } else {

                Category.findById((id), (err, foundCategory) => {
                    if (err) return console.log(err);
                    foundCategory.title = title
                    foundCategory.slug = slug
                    foundCategory.save(err => {
                        if (err)
                            return console.log(err);

                        req.flash('success', 'category updated!')
                        res.render('admin/categories/edit-category', {
                            title: foundCategory.title,
                            slug:foundCategory.slug,
                            id: foundCategory._id
                        })

                    })

                })

            }
        })
    }


})

//Post delete Category
router.get('/delete-category/:slug', (req, res) => {
    const id = req.params.slug;
    console.log(id);
    

    Category.deleteOne({ _id: id }, (err, foundCategory) => {
        if (err) return console.log(err);
        res.redirect('/admin/categories')
    })

})
//Post delete Page
// router.get('/delete-page/:slug' , (req,res)=>{
//     const slug = req.body.slug;

//     Pages.findOneAndDelete({slug:slug} , (err, page)=>{
//         if (err) return console.log(err);
//         res.redirect('admin/pages')
//     })

//  })

module.exports = router