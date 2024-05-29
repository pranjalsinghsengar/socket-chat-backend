import express from 'express'
import { HandlerSignUp, HandlerLogin, HandlerLogout } from "../controller/user.js"
 
const router = express.Router()

router.post('/login' , HandlerLogin)
router.post('/signup' , HandlerSignUp)
router.post('/logout' , HandlerLogout)

export default router