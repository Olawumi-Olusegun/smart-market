import express from "express";
import { deleteProduct, deleteProductImage, getLatestProducts, getListings, getProductDetails, getProductsById, listNewProduct, updateProduct } from "src/controllers/product.controller";
import { newProductSchema } from "src/helpers/validationSchema";
import fileParser from "src/middlewares/fileParser";
import { isAuth } from "src/middlewares/isAuth";
import validate from "src/middlewares/validator";

const productRouter = express.Router();

productRouter.post("/list", isAuth, fileParser, validate(newProductSchema), listNewProduct);
productRouter.patch("/:productId", isAuth, fileParser, validate(newProductSchema), updateProduct);
productRouter.delete("/:productId", isAuth, deleteProduct);
productRouter.delete("/image/:productId/:imageId", isAuth, deleteProductImage);
productRouter.get("/detail/:productId", isAuth, getProductDetails);
productRouter.get("/by-category/:category", isAuth, getProductsById);
productRouter.get("/latest", getLatestProducts);
productRouter.get("/listings", isAuth, getListings);


export default productRouter;