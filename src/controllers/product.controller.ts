import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import cloudUploader, { cloudApi } from "src/constants/cloudinary";
import categories from "src/helpers/categories";
import { errorHandler } from "src/helpers/errorHandler";
import ProductModel from "src/models/product.model";
import { UserDocument } from "src/models/user.model";

const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
    return cloudUploader.upload(filePath, {
        width: 128,
        height: 720,
        crop: "fill",
    });
}

export const listNewProduct: RequestHandler = async (req, res,) => {
    const { name, price, category, description, purchasingDate } = req.body;

    const newProduct = new ProductModel({ owner: req.user.id, name, price, category, description, purchasingDate});

    const images = req.files.images;

    const isMultipleImages = Array.isArray(images);

    if(isMultipleImages && images.length > 5) {
       
        return errorHandler(res, "Image files cannot be more than five", 422); 
    }

    let invalidFileType = false;

    if(isMultipleImages) {
        for(let image of images) {
            if(!image.mimetype?.startsWith("image")) {
                invalidFileType = true;
                break;
                
            }
        }
    } else {
        if(images) {
            if(!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }
    }

    if(invalidFileType) {
        return errorHandler(res, "Invalid file type, files must be an image", 422); 
    }

    if(isMultipleImages) {

        const uploadPromise = images.map((file) => uploadImage(file.filepath));

        const uploadResults = await Promise.all(uploadPromise);

        newProduct.images = uploadResults.map(({secure_url, public_id}) => {
            return { url: secure_url, id:public_id }
        })

        newProduct.thumbnail = newProduct.images[0].url;

    } else {
        if(images) {
           const {secure_url, public_id} =  await uploadImage(images.filepath);
           newProduct.images = [{id: public_id, url: secure_url}];
           newProduct.thumbnail = secure_url;
        }
    }

    await newProduct.save();

    return res.status(201).json({ message: "Added new product" })
}

export const updateProduct: RequestHandler = async (req, res) => {

    const { productId } = req.params;

    const { name, price, category, description, purchasingDate, thumbnail} = req.body;

    if(!isValidObjectId(productId)) {
        return errorHandler(res, "Invalid product ID", 422); 
    }

    const product = await ProductModel.findOneAndUpdate({ _id: productId, owner: req.user.id }, {
        $set: { name, price, category, description, purchasingDate } }, { new: true });

    if(!product) {
        return errorHandler(res, "No product found", 404); 
    }

    if(typeof thumbnail === 'string') {
        product.thumbnail = thumbnail;
    }


    if(product.images && product.images.length === 5) {
        return errorHandler(res, "Product already has five images ", 422); 
    }

    const images = req.files.images;

    if(images) {
        const isMultipleImages = Array.isArray(images);
    
        if(isMultipleImages) {
             const oldImages = product.images?.length ?? 0;
            if(oldImages + images.length > 5) {
                return errorHandler(res, "Image files cannot be more than five", 422);
            }
        }
    
        let invalidFileType = false;
    
        if(isMultipleImages) {
            for(let image of images) {
                if(!image.mimetype?.startsWith("image")) {
                    invalidFileType = true;
                    break;
                    
                }
            }
        } else {
            if(images) {
                if(!images.mimetype?.startsWith("image")) {
                    invalidFileType = true;
                }
            }
        }
    
        if(invalidFileType) {
            return errorHandler(res, "Invalid file type, files must be an image", 422); 
        }
    
        if(isMultipleImages) {
            const uploadPromise = images.map((file) => uploadImage(file.filepath));
    
            const uploadResults = await Promise.all(uploadPromise);
    
            const newImages = uploadResults.map(({secure_url, public_id}) => {
                return { url: secure_url, id:public_id }
            })

            if(product.images) {
                product.images.push(...newImages)
            }else {
                product.images = newImages;
            }
    
    
        } else {

            if(images) {
               const {secure_url, public_id} =  await uploadImage(images.filepath);

                if(product.images) {
                    product.images.push({id: public_id, url: secure_url})
                }else {
                    product.images = [{id: public_id, url: secure_url}];
                }
            }
        }
    


    }

    await product.save();

    return res.status(200).json({ message: "Product updated"});

}

export const deleteProduct: RequestHandler = async (req, res) => {
    
    const { productId } = req.params;

    if(!isValidObjectId(productId)) {
        return errorHandler(res, "Invalid productId", 422); 
    }

    const product = await ProductModel.findOne({_id: productId, owner: req.user.id });

    if(!product) {
        return errorHandler(res, "No product found", 404);
    }

    const images = product.images as {id: string; url: string}[]  || [];

    if(images.length) {
        const imageIds = images.map((image) => image.id);
        await cloudApi.delete_all_resources([...imageIds]);
    }

    await product.deleteOne();


}

export const deleteProductImage:RequestHandler = async (req, res) => {
       
    const { productId, imageId } = req.params;

    if(!isValidObjectId(productId)) {
        return errorHandler(res, "Invalid productId", 422); 
    }

    const product = await ProductModel.findOne({_id: productId, owner: req.user.id });

    if(!product) {
        return errorHandler(res, "No product found", 404);   
    }

    if(!product.images || product.images.length === 0 ) {
        return errorHandler(res, "No image found", 404);
    }

    const imageIndex = product.images.findIndex(item => item.id === imageId);

    if(imageIndex === -1) {
        return errorHandler(res, "Image not found", 404);
    }

    const oldImagesLength = product?.images?.length ?? 0;

    if(oldImagesLength && imageIndex) {

        if(oldImagesLength <= 1) {
            return errorHandler(res, "Product images cannot be less than one", 422);  
        }

        await cloudUploader.destroy(imageId);
        product.images.splice(imageIndex, 1);

    }

    if(product.thumbnail?.includes(imageId)) {
        const imagesArray = product.images;
        if(imagesArray) {
            product.thumbnail = imagesArray[0].url;
        } else {
            product.thumbnail = "";
        }
    }

    await product.save();

    return res.status(200).json({ message: "Image deleted successfully" });
}

export const getProductDetails: RequestHandler = async (req, res) => {
    
    const { productId } = req.params;

    if(!isValidObjectId(productId)) {
        return errorHandler(res, "Invalid productId", 422);
    }

    const product = await ProductModel.findById(productId).populate<{owner: UserDocument}>("owner");

    if(!product) {
        return errorHandler(res, "Product not found", 404);
    }

    return res.status(200).json({
        product: {
        id: product._id,
        name: product.name,
        price: product.price,
        date: product.purchasingDate,
        category: product.category,
        images: product.images?.map((image) => image.url) || [],
        thumbnail: product.thumbnail,
        description: product.description,
        seller: {
            id: product.owner._id,
            name: product.owner.name,
            avatar: product.owner?.avatar?.url,
        }
    },

});


}

export const getProductsById: RequestHandler = async (req, res) => {
    
    const { category } = req.params;

    let { pageNo = '1', limit = "10" } = req.query as { pageNo: string; limit: string; }; 

    if(!categories.includes(category)) {
        return errorHandler(res, "Invalid category", 422);     
    }

    const skip = (Number(pageNo) - 1) * Number(limit);
    const limitBy = Number(limit);

    const products = await ProductModel.find({ category }).sort("-createdAt").skip(skip).limit(limitBy);

   const listings = products.map((product) => {
        return {
            id: product._id,
            name: product.name,
            thumbnail: product?.thumbnail ?? undefined,
            category: product.category,
            price: product.price,
        }
    });

    return res.status(200).json({ products: listings })

}

export const getLatestProducts: RequestHandler = async (req, res) => {

    const products = await ProductModel.find({}).sort("-createdAt").limit(10);

    const listings = products.map((product) => {
         return {
             id: product._id,
             name: product.name,
             thumbnail: product?.thumbnail ?? undefined,
             category: product.category,
             price: product.price,
         }
     });
 
     return res.status(200).json({ products: listings })

}

export const getListings: RequestHandler = async (req, res) => {

    let { pageNo = '1', limit = "10" } = req.query as { pageNo: string; limit: string; }; 


    const skip = (Number(pageNo) - 1) * Number(limit);
    const limitBy = Number(limit);
    
    const products = await ProductModel.find({ owner: req.user.id }).sort("-createdAt").skip(skip).limit(limitBy);

    const listings = products.map((product) => {
         return {
             id: product._id,
             name: product.name,
             thumbnail: product?.thumbnail ?? undefined,
             category: product.category,
             price: product.price,
             images: product.images?.map((image) => image.url),
             description: product.description,
             date: product.purchasingDate,
             seller: {
                id: req.user.id,
                name: req.user.name,
                avatar: req.user.avatar
             }
         }
     });
 
     return res.status(200).json({ products: listings })
}