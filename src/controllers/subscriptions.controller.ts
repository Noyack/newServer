import { HttpStatusCode } from "axios";
import { db } from "../db";
import { subscriptions } from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";

export const createSubscriptions = async(userId:string):Promise<any> =>{
  try {
    await db.insert(subscriptions).values({
        userId,
    });
    return 201
    // console.log(`User created with clerkId: ${userData.id}`);
  } catch (error) {
      throw new AppError('Could not create subscription', 400)
  }
}

export const getSubscriptions = async(
  req: AuthenticatedRequest,
  res: Response) => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }
  try {
    const userId= req.userId
    const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.userId));
    if(!sub){

      await db.insert(subscriptions).values({
        userId,
      }).then(async()=>{
        const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.userId));
        res.status(201).json({ data: sub });

      })
    }
    else
    res.status(201).json({ data: sub });
  } catch (error) {
      throw new AppError('Could not get subscription', 400)
  }
}