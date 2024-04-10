import express from 'express'
import { createOrder, deleteOrder, getAllOrder, getLoggedUserOrder, getSingleOrder, stripePay, updateOrder } from '../controllers/orderController.js'
import { isAuth, verifyAdmin } from '../middleware/auth.js'

let orderRouter = express.Router()

orderRouter.post("/new",isAuth, createOrder)
orderRouter.get("/me",isAuth, getLoggedUserOrder)
orderRouter.get("/one/:id",isAuth, getSingleOrder)


//Admin
orderRouter.get("/all", isAuth,verifyAdmin,getAllOrder)
orderRouter.put("/update",isAuth, verifyAdmin,updateOrder)
orderRouter.delete("/:id",isAuth, verifyAdmin,deleteOrder)

orderRouter.post("/payment", isAuth,stripePay)


export default orderRouter