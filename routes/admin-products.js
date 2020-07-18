const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const mkdirp = require('mkdirp')
const fs = require('fs-extra')
const path = require('path')
const resizeImg = require('resize-img')

const Products = require('../models/Product')
const Categories = require('../models/Category')
const { nextTick } = require('process')
const Product = require('../models/Product')

// Get add-product
router.get('/add-product', (req, res) => {
    Categories.find({}, (err, categories) => {
        if (err) return console.log(err);
        res.render('admin/products/add-product', {
            title: null,
            desc: null,
            categories: categories,
            price: null
        })

    })

})
// Get products

router.get('/', (req, res) => {

    Products.find({}, (err2, products) => {
        if (err2) return console.log(err);
        Products.countDocuments({}, (err, count) => {
            if (err) return console.log(err);
            res.render('admin/products/products', {
                count: count,
                products: products
            })
        });

    });
})
let lowerCase = (body) => {
    let result = Object.assign(body);
    for (let prop in result) {
        result[prop] = result[prop].toLowerCase()
    }
    return result;
}
//Post add-product
router.post('/add-product', [
    body('title', 'title must have a value').notEmpty(),
    body('desc', 'description must have a value').notEmpty(),
    body('price', 'price must have a value').isDecimal(),
    body('img').custom((v, { req }) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            console.log('no file to upload');

            req.imgFile = ''
            return true
        } else {
            req.imgFile = req.files.img.name
        }

        const extension = (path.extname(req.imgFile)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case '.png':
                return '.png';
            default: return false
        }

    }).withMessage('please upload an image!'),

], (req, res) => {
    const errors = validationResult(req)
    const imageFile = req.imgFile

    let { title, slug, desc, price, category } = lowerCase(req.body)

    if (!slug) slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {

        Categories.find({}, (err, categories) => {
            if (err) return console.log(err);
            res.render('admin/products/add-product', {
                errors: errors.errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            })

        })
    } else {
        Products.findOne({ slug: slug }, (err, foundProduct) => {
            if (err) {
                return console.log(err);
            }
            if (foundProduct) {
                req.flash('danger', 'product title exists choose another!')
                Categories.find({}, (err, categories) => {
                    if (err) return console.log(err);
                    res.render('admin/products/add-product', {
                        errors: errors.errors,
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    })

                })
            } else {
                const priceFormat = parseFloat(price).toFixed(2);
                const newProduct = new Products({ title: title, slug: slug, desc: desc, price: priceFormat, category: category, img: imageFile || '' })
                newProduct.save(err => {
                    if (err) {
                        return console.log(err);
                    }


                    mkdirp('public/product_images/' + newProduct._id).then(() => {
                        mkdirp('public/product_images/' + newProduct._id + '/gallery')
                        mkdirp('public/product_images/' + newProduct._id + '/gallery/thumbs');
                        if (req.files == undefined || null) return ;
                        
                            let imageProduct = req.files.img;
                            let path = 'public/product_images/' + newProduct._id + "/" + imageFile;

                            imageProduct.mv(path, err => {
                                if (err) return console.log( err);
                            })
                        
                    }).catch((err) => {
                        if (err) return console.log(err);

                    })


                    req.flash('success', 'product added!')
                    res.redirect('/admin/products')

                })
            }
        })
    }
})

// get edit-product
router.get('/edit-product/:id', (req, res) => {
    let errors = null;
    if (req.session.errors)
        errors = req.session.errors
    req.session.errors

    const id = req.params.id
    Categories.find((err, categories) => {
        Product.findById({ _id: id }, (err, product) => {
            if (err) return console.log(err);
            let gallaryDir = `public/product_images/${id}/gallery`
            let galleryImages = null
            fs.readdir(gallaryDir).then((files) => {

                galleryImages = files
                res.render('admin/products/edit-product', {
                    errors: errors,
                    title: product.title,
                    desc: product.desc,
                    categories: categories,
                    selectedCate: product.category,
                    price: parseFloat(product.price).toFixed(2),
                    desc: product.desc,
                    dbImg: product.img,
                    galleryImages: galleryImages,
                    id: id
                })
            }).catch(err => console.log(err))
        })
    })

})

// Post edit-product
router.post('/edit-product/:id', [
    body('title', 'title must have a value').notEmpty(),
    body('desc', 'description must have a value').notEmpty(),
    body('price', 'price must have a value').isDecimal(),
    body('img', 'please upload an image!').custom((v, { req }) => {
        if (!(req.files && req.files.img && req.files.img.name)) {
            req.imgFileName = ''
            return true
        }

        req.imgFileName = req.files.img.name
        const extension = (path.extname(req.imgFileName)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case '.png':
                return '.png';
            default: return false
        }

    }).withMessage(),
], (req, res) => {
    let imageFile = req.imgFileName
    const errors = validationResult(req)
    const { title, desc, price, category, dbImg } = lowerCase(req.body)

    const id = req.params.id
    const slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {
        Categories.find((err, categories) => {
            res.render('admin/products/edit-product', {
                errors: errors.errors,
                title: title,
                desc: desc,
                categories: categories,
                selectedCate: category,
                price: price,
                desc: desc,
                dbImg: dbImg,
                id: id
            })

        })



    } else {

        Products.findOne({ slug: slug, _id: { $ne: id } }, (err, foundPage) => {

            if (err)
                return console.log(err);
            if (foundPage) {

                req.flash('danger', 'product slug exists choose another!')
                Categories.find((err, categories) => {
                    res.render('admin/products/edit-product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        selectedCate: category,
                        price: price,
                        desc: desc,
                        dbImg: dbImg,
                        id: id
                    })

                })
            } else {

                Products.findOne({ _id: id }, (err, product) => {

                    if (err) return console.log(err);
                    product.title = title
                    product.desc = desc
                    product.price = price
                    product.category = category
                    product.price = price

                    product.img = (imageFile || dbImg)

                    product.save(err => {
                        if (err)
                            return console.log(err);
                        if (req.files != undefined || null) {
                            if(dbImg!=''){
                                fs.remove('public/product_images/' + product._id + "/" + dbImg)
                            }
                            mkdirp('public/product_images/' + product._id).then(() => {
                            
                                const imageProduct = req.files.img
                                let path = 'public/product_images/' + product._id + "/" + imageFile
                                imageProduct.mv(path, err => {
                                    if (err) return console.log( err);

                                })
                            }).catch((err) => {
                                if (err) return console.log( err);

                            })
                        }
                        req.flash('success', 'product updated!')

                        Categories.find((err, categories) => {
                            res.redirect('/admin/products')

                        })
                    })
                })
            }
        })
    }

})

//get delete product
router.get('/delete-product/:slug', (req, res) => {
    const id = req.params.slug;

    Products.deleteOne({ _id: id }, (err, page) => {
        if (err) return console.log(err);
        fs.remove('public/product_images/' + id)
        res.redirect('/admin/products')
    })
})
router.get('/delete-image/:image', (req, res) => {
    const id = req.query.id;
    const image = req.params.image
    
    const galleryPath = `public/product_images/${id}/gallery/${image}` 
    const thumbsPath = `public/product_images/${id}/gallery/thumbs/${image}`
    fs.remove(galleryPath , (err)=>{
        if(err) return console.log(err);
        fs.remove(thumbsPath ,(err)=>{
            if(err) return console.log(err);
            res.redirect('/admin/products/edit-product/' + id)
            
        })
    })
})
router.post('/product-gallery/:id', (req, res) => {
    const id = req.params.id;
    const productImages = req.files.file;
    
    const galleryPath = `public/product_images/${id}/gallery/${productImages.name}` 
    const thumbsPath = `public/product_images/${id}/gallery/thumbs/${productImages.name}`
    productImages.mv(galleryPath , (err)=>{
        resizeImg(fs.readFileSync(galleryPath) ,{width:100 , height:100}).then((buff)=>{
            fs.writeFileSync(thumbsPath , buff)
        })
        
    })
    res.sendStatus(200)

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