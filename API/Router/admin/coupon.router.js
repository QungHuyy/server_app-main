const express = require('express')

const router = express.Router()

const Coupon = require('../../Controller/admin/coupon.controller')

router.get('/', Coupon.index)

router.post('/', Coupon.create)

router.patch('/:id', Coupon.update)

router.delete('/:id', Coupon.delete)

router.get('/detail/:id', Coupon.detail)

router.get('/promotion/checking', Coupon.checking)

router.patch('/promotion/:id', Coupon.createCoupon)

router.post('/restore', Coupon.restoreCoupon)

module.exports = router