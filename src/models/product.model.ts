import { Document, Model, Schema, model, models } from "mongoose";
import categories from "src/helpers/categories";

type ProductImage = { url: string; id: string }

export interface ProductDocument extends Document {
    owner: Schema.Types.ObjectId;
    name: string;
    price: number;
    purchasingDate: Date;
    category: string;
    images?: ProductImage[]
    thumbnail?: string;
    description: string;
}

const productSchema = new Schema<ProductDocument>({
    owner:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, trim: true },
    purchasingDate: { type: Date, required: true, },
    category: { type: String, enum: [...categories], required: true },
    images: [{ type: Object, url: String, id: String,}],
    thumbnail: { type: String, },
    description: { type: String, required: true, trim: true },
}, { timestamps: true });


const ProductModel = models.Product || model("Product", productSchema);

export default ProductModel as Model<ProductDocument>;