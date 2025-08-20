import { HttpStatusCode } from "axios";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";
import { desc, eq } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { wealthIq } from "../db/schema";

export const saveIq = async(
    req: AuthenticatedRequest,
    res: Response
):Promise<any> =>{
  const wealthIQData= req.body
  console.log(wealthIQData)
  try {
    await db.insert(wealthIq).values(wealthIQData)
    res.send({data: "Score saved!"})
  } catch (error) {
    console.log(error)
      throw new AppError('Could not add the score', 400)
  }
}

export const getIq = async(
    req: AuthenticatedRequest,
    res: Response
):Promise<any> =>{
  const userId = req.user
  try {
    const scores = await db.query.wealthIq.findMany({
      where:eq(wealthIq.userId, userId.id), orderBy: desc(wealthIq.createdAt)
    })
    res.send({data: scores})
  } catch (error) {
    console.log(error)
      throw new AppError('Could not add the score', 400)
  }
}

// export const getSubscriptions = async(
//   req: AuthenticatedRequest,
//   res: Response) => {
//     if (!req.userId) {
//       throw new AppError('User not authenticated', 401);
//     }
//   try {
//     const userId= req.userId
//     const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.userId));
//     if(!sub){

//       await db.insert(subscriptions).values({
//         userId,
//       }).then(async()=>{
//         const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.userId));
//         res.status(201).json({ data: sub });

//       })
//     }
//     else
//     res.status(201).json({ data: sub });
//   } catch (error) {
//       throw new AppError('Could not get subscription', 400)
//   }
// }