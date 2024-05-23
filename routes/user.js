const express = require('express')
const { HandlerSignUp, HandlerLogin, HandlerLogout } = require('../controller/user')
const router = express.Router()

router.post('/' , HandlerLogin)
router.post('/signup' , HandlerSignUp)
router.post('/logout' , HandlerLogout)

module.exports = router