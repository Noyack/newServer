import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { createSubscriptions } from "./subscriptions.controller";
import { initiateBasicInfo } from "./basicInfo.controller";

// setup basic info, assets, assets & allocation, debt profile expenses,
// emergency fund tables

// setup subcription row
// sync with hubspot
export const OnboardingCompleted = async(userId:string):Promise<void> =>{
    try{
        if(!userId){
            throw new AppError('User not authenticated', 401);
        }
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        })
        if(!user){
            throw new AppError('Could not find user', 404)
        }

        const sub = await createSubscriptions(userId)
        if(sub === 201){
            await initiateBasicInfo(userId)
        }
    }
    catch(error) {
        if (error instanceof AppError) {
            throw new AppError(error.message, 400);
        } else {
         throw new Error('Internal server error');      
        }
    }
}