import { findAll, findCById, createOne, addProduct, deleteOneProduct, deleteAll, updateCart } from "../service/cart.service.js";
import { findById } from "../service/product.service.js";
import { Cart } from "../DAL/dao/MongoDB/cartsManagerDB.js";
import { createOneT } from "../service/ticket.service.js";
import { generateUniqueCode } from "../utils";
import jwt from "jsonwebtoken";
import config from "../config/configs.js" 
import CustomError from "../errors/error.generate.js";
import { ErrorMessages, ErrorName } from "../errors/errors.enum.js";

export const findCartById = async (req, res) => {
    const { cid } = req.params;
    try {
        const cart = await findCById(cid);
        ;
        if (!cart) {
           return CustomError.generateError(ErrorMessages.CART_NOT_FOUND,404,ErrorName.CART_NOT_FOUND);
        }
        res.status(200).json({ message: "Cart found", cart });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const findAllCart = async (req, res) => {
    try {
        const carts = await findAll();
        if (!carts || carts.length === 0) {
            return res.status(404).json({ message: "No carts found" });
        }
        res.status(200).json({ message: "Carts found", carts });
    } catch (error) {
         res.status(500).json({ message: "Internal server error" });
    }
}

export const createOneCart = async (req, res) => {
    try {
        const cart = await createOne();
        res.status(201).json({ message: "Cart created", cart });
    } catch (error) {
       res.status(500).json({ message: "Internal server error" });
    }
}

export const addProductCart = async (req, res) => {
    const { cid , pid } = req.params;
    try {
        const productAdd = await findById(pid);
        const cartNow = await findCById(cid);
        if (productAdd.stock) {
            const response = await addProduct(cid,pid);
            res.status(200).json({ message: "Product added to cart", cart: response })}
            else {
                res.status(404).json({ message: "Stock insuficiente" });
            };
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteOneProdCart = async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const response = await deleteOneProduct(cid,pid);
        res.status(200).json({ message: "Product delete to cart", cart: response });
    
    } catch (error){
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteOneCartAll = async (req, res) => {
    try {
        const { cid } = req.params;
        const response = await deleteAll(cid);
        res.status(200).json({ message: "Cart delette", cart: response });   
    } catch (error){
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateCartQuantity = async (req, res) => {
    const { pid , quantity } = req.body;
    const { cid } = req.params;
    try {
        const response = await Cart.update(cid , pid , quantity);
        res.status(200).json({ message: "cart update", cart: response });
    } catch (error){
        res.status(500).json({ message: "Internal server error" });
    }
}

export const cartBuy = async (req,res) => {
    try {
        const { cid } = req.params;
        console.log("cid ticket", cid);
        const secretKeyJwt = config.secret_jwt;        
        const cart = await Cart.findCById(cid);  
        console.log("cart ticket",cart);
        const products = cart.products;
        console.log("product ticket",products);
        let availableProducts = [];
        let unavailableProducts = [];
        let totalAmount = 0;
    
        for (let item of products) {
            if (item.product.stock >= item.quantity) {
                availableProducts.push(item);
                item.product.stock -= item.quantity;
                await item.product.save();
                totalAmount += item.quantity * item.product.price;
            } else {
                 unavailableProducts.push(item);
            }
        }    
        console.log("disponible", availableProducts, "nodisp", unavailableProducts);
        cart.products = unavailableProducts;
        await cart.save();
        const token = "fyVhbGkiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOpI2NTZlMWFfMjU1YzY4OTdjODNmNDdjZDMiLCJuYW1lIjoiR2FicmllbGEiLCJtYWlsIjoiZ1FieW1hdWp3QGdtYWlsLmNvbSIsInJvaGUiOiJ1c2VyIiwiaWG0IjoxNzAzNzIxMDjwLCJleHAiOjW3MDM3MjQ2OTB9.lKMgvK37iteA4BTGSKa32EXJyBB2ekxqOb7wtEeD7Kho";
        console.log("token ticket",token);
        const userToken = jwt.verify(token, secretKeyJwt);
        console.log("userticket", userToken);
        if (availableProducts.length) {
            const ticket = {
                code: generateUniqueCode(),
                purchase_datetime: new Date(),
                amount: totalAmount,
                purchaser: userToken.mail,
            };

            console.log("ticket", ticket);
            const ticketFinal = await createOneT(ticket);
            return { availableProducts, totalAmount, ticketFinal };
        }
        return { unavailableProducts };
    } catch (error) {
        
        res.status(500).json({ error: 'Error interno del servidor' }); 
    }};
    