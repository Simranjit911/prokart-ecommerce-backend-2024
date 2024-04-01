
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import stripe from 'stripe'
const stripeClient = stripe(process.env.STRIPE_SK)


// Stripe Payment
export async function stripePay(req, res) {
    try {
        const cart = req.body
        const lineItems = cart.map((prod) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: prod.name
                },
                unit_amount: prod.price * 100,
            },
            quantity: prod.qty,

        }))


        stripeClient.checkout.sessions
            .create({
                payment_method_types: ["card"],
                line_items: lineItems,
                mode: "payment",
                  customer_email: req?.user?.email,          
                success_url: "http://localhost:5173/success",
                cancel_url: "http://localhost:5173/cancel",
            })
            .then((session) => {
                res.status(200).json({ id: session.id });
            })
            .catch((error) => {
                console.error("Stripe Error:", error);
                res.status(500).json({ error: "An error occurred during payment processing" });
            });

    } catch (error) {
        res.status(200).json({ error: error })
    }

}


//ceate order
export async function createOrder(req, res) {
    try {
        let { userDetails, user, orderedItems } = req.body

        // user = req.user._id

        // userDetails.user = req.user._id
        // userDetails.name = req.user.name
        let paymentMt = req.body.paymentMethod
        if (paymentMt == "Cash on delivery") {
            req.body.isPaid = "no"
        } else {
            req.body.isPaid = "yes"
        }


        orderedItems.map(async (item) => {
            let product = await productModel.findById(item.productId)
            product.stock -= item.qty
            await product.save({ validateBeforeSave: false })
        })

        let order = await orderModel.create({ ...req.body })
        console.log("order", order)
        order.orderedTime=new Date().toLocaleString()
        await order.save()
        res.status(200).json({ msg: "Order created!", order })
    } catch (error) {
        console.log(error)
    }
}

//get single order
export async function getSingleOrder(req, res) {
    try {
        let order = await orderModel.findById(req.params.id).populate("user", "name email")
        if (!order) {
            return res.status(404).json({ msg: "Order not Found with this Id!" })
        }
        return res.status(200).json({ msg: "Order  Found !", order })


    } catch (error) {
        console.log(error)
    }
}
// logged user orders
export async function getLoggedUserOrder(req, res) {
    try {
        let order = await orderModel.find({ user: req.user._id })
        if (!order) {
            return res.status(404).json({ msg: "Order not Found with this Id!" })
        }
        return res.status(200).json({ msg: "Order  Found !", order, total: order.length })


    } catch (error) {
        console.log(error)
    }
}



export async function getAllOrder(req, res) {
    try {
        const orderStatusCounts = await orderModel.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        const orders = await orderModel.find();
        if (!orders.length) {
            return res.status(404).json({ msg: "No orders found!" });
        }

        // Calculate total amount by summing up totalPrice from each order
        const totalAmount = orders.reduce((total, order) => total + order.totalPrice, 0);
        console.log(orderStatusCounts)
        return res.status(200).json({
            msg: "All orders found!",
            orders,
            total: orders.length,
            totalAmount,
            orderLen: orders.length,
            orderStatusCounts
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// export async function updateOrder(req, res) {
//     try {
//         let { orderId } = req.query
//         let checkorderExists = await orderModel.findById(orderId)

//         if (!checkorderExists) {
//             return res.status(404).json({ msg: "Invalid Order Id" })
//         } else {
//             if (req.body.paymentMethod == "Cash on delivery") {
//                 if (req.body.orderStatus == "delivered") {
//                     checkorderExists.isPaid = "yes"
//                     await checkorderExists.save()

//                 } else {
//                     checkorderExists.isPaid = "no"
//                     await checkorderExists.save()
//                 }
//             }
//             let order = await orderModel.findByIdAndUpdate(orderId, req.body, { new: true })
//             console.log(order)
//             res.status(200).json({ msg: "Order Updated", order })
//         }



//     } catch (error) {
//         console.log(error)
//     }
// }
export async function updateOrder(req, res) {
    try {
        const { orderId } = req.query;
        const { paymentMethod, orderStatus } = req.body;
        // Check if the order exists
        const orderExists = await orderModel.findById(orderId);
        if (!orderExists) {
            return res.status(404).json({ msg: "Invalid Order Id" });
        }
        console.log(orderExists, orderStatus)

        // Update isPaid based on payment method and order status
        if (orderExists.paymentMethod === "Cash on delivery") {
            if (orderStatus === "delivered") {
                orderExists.isPaid = "yes";
                await orderExists.save()
            } else {
                orderExists.isPaid = "no";
                await orderExists.save()
            }
        }

        // Update the order
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, req.body, { new: true });
        // console.log(updatedOrder)
        res.status(200).json({ msg: "Order Updated", order: updatedOrder });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ msg: "Error updating order", error });
    }
}

export async function deleteOrder(req, res) {
    try {
        let id = req.params.id;
        console.log(id);

        let order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ msg: "Order not found" });
        } else {
            let { orderedItems } = order;
            for (let item of orderedItems) {
                let product = await productModel.findById(item.productId);
                if (product) {
                    product.stock += item.qty;
                    await product.save({ validateBeforeSave: false });
                }
            }
            let del = await orderModel.deleteOne({ _id: id });
            res.status(200).json({ msg: "Order cancelled!", del });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
