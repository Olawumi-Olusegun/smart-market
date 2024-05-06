import { isValidObjectId } from "mongoose";
import * as yup from "yup";
// import categories from "./categories";
import { parseISO } from "date-fns";
import categories from "./categories";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

yup.addMethod(yup.string, "email", function validateEmail(message) {
  return this.matches(emailRegex, {
    message,
    name: "email",
    excludeEmptyString: true,
  });
});

const password = {
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password should be at least 8 chars long!")
    .matches(passwordRegex, "Password is too simple."),
};

export const newUserSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email!").required("Email is required"),
  ...password,
});

const tokenAndId = {
  id: yup.string().test({
    name: "valid-id",
    message: "Invalid user id",
    test: (value) => {
      return isValidObjectId(value);
    },
  }),
  token: yup.string().required("Token is required"),
};

export const verifyTokenSchema = yup.object({
  ...tokenAndId,
});

export const resetPassSchema = yup.object({
  ...tokenAndId,
  ...password,
});

export const newProductSchema = yup.object({
  name: yup.string().required("Name is required!"),
  description: yup.string().required("Description is required!"),
  category: yup
    .string()
    .oneOf(categories, "Invalid category!")
    .required("Category is required!"),
  price: yup
    .string()
    .transform((value) => {
      if (isNaN(+value)) return "";

      return +value;
    })
    .required("Price is required!"),
  purchasingDate: yup
    .string()
    .transform((value) => {
      try {
        return parseISO(value);
      } catch (error) {
        return "";
      }
    })
    .required("Purchasing date is required!"),
});