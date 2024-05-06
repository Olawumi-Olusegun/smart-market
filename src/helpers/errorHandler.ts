import { Response } from "express";

export const errorHandler = async (res: Response, message: string, statusCode: number) => {
    return res.status(statusCode).json({message});
}