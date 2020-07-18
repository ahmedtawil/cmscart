const router = require('express').Router()
const { check, validationResult, Result } = require('express-validator')
const Pages = require('../models/Page')
const mongoose = require('mongoose')

// Get pages
// Get add-page
router.get('/add-page', (req, res) => {
    res.render('admin/pages/add-page', {
        title: null,
        slug: null,
        content: null
    })
})

let loadData = (data , req)=>{
        req.app.locals.pages = data
}

router.get('/', (req, res) => {
    Pages.find({}, (err, found) => {

        if (err) console.log(err);
        let sortingArray = found.sort((a, b) => { return a.sorting - b.sorting })

        res.render('admin/pages/pages', {
            pages: sortingArray,

        })
        loadData( found , req)
    })
})
let lowerCase = (body) => {
    let result = Object.assign(body);
    for (let prop in result) {
        result[prop] = result[prop].toLowerCase()
    }
    return result;
}
//Post add-page
router.post('/add-page', [
    check('title', 'title must have a value').notEmpty(),
    check('content', 'content must have a value').notEmpty()
], (req, res) => {

    const errors = validationResult(req)

    let { title, slug, content } = lowerCase(req.body)

    slug = slug.replace('/\s+/g', '-')
    if (!slug) slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {

        res.render('admin/pages/add-page', {
            errors: errors.errors,
            title: title,
            slug: slug,
            content: content
        })
    } else {
        Pages.findOne({ slug: slug }, (err, foundPage) => {
            if (err) {
                return console.log(err);
            }
            if (foundPage) {
                req.flash('danger', 'page slug exists choose another!')
                res.render('admin/pages/add-page', {
                    title: title,
                    slug: null,
                    content: content
                })
            } else {
                let newPage;
                if (title == 'home') {
                    newPage = new Pages({ title: title, slug: slug, content: content, sorting: 0 })
                } else {
                    newPage = new Pages({ title: title, slug: slug, content: content, sorting: 100 })
                }
                newPage.save(err => {
                    if (err) {
                        return console.log(err);
                    }
                    req.flash('success', 'page added!')
                    res.redirect('/admin/pages')

                })
            }
        })
    }
    
})

function sortPage (ids ){
    
}

// Post reorder pages

router.post('/reorder-pages', (req, res) => {
    const ids = req.body.ids
    ids.map((pageId, index) => {
        Pages.findById(pageId, (err, page) => {
            page.sorting = index + 1;
            page.save(err => {
                index++
                if (index >= ids.length) {
                    Pages.find().then((data) => {
                        loadData(data, req)
                        //console.log(data);
                        console.log('----------');
                        res.redirect('/admin/pages')
                    })
                }
            })
        })

    })
})

// get edit-page
router.get('/edit-page/:id', (req, res) => {
    const id = req.params.id
    Pages.findById({ _id: id }, (err, page) => {
        if (err) console.log(err);
        res.render('admin/pages/edit-page', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        })
    })
    
})

// Post edit-page
router.post('/edit-page/:id', [
    check('title', 'title must have a value').notEmpty(),
    check('content', 'content must have a value').notEmpty()
], (req, res) => {

    const errors = validationResult(req)
    let { title, content } = lowerCase(req.body);
    let slug = req.body.slug.replace('/\s+/g', '-')
    let id = req.params.id
    if (slug == '') slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {
        res.render('admin/pages/edit-page', {
            errors: errors.errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        })
    } else {

        Pages.findOne({ slug: slug, _id: { $ne: id } }, (err, foundPage) => {

            if (err)
                return console.log(err);

            if (foundPage) {
                req.flash('danger', 'page slug exists choose another!')
                res.render('admin/pages/edit-page', {
                    title: title,
                    slug: null,
                    content: content,
                    id: id
                })
            } else {

                Pages.findById((id), (err, page) => {
                    if (err) return console.log(err);
                    page.title = title
                    page.slug = slug
                    page.content = content

                    page.save(err => {
                        if (err)
                            return console.log(err);

                        req.flash('success', 'page updated!')
                        res.redirect('/admin/pages')
                    })

                })

            }
        })
    }


})

//Post delete Page
router.get('/delete-page/:slug', (req, res) => {
    const id = req.params.slug;

    Pages.deleteOne({ _id: id }, (err, page) => {
        if (err) return console.log(err);
        res.redirect('/admin/pages')
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