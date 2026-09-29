import { Router, type IRouter, type Request, type Response } from "express";
import { getAiUsage, setAiUsageControls } from "../lib/ai-usage";
const router: IRouter = Router();
function admin(req:Request,res:Response){const key=process.env.CLASHIQ_ADMIN_KEY||process.env.MECKA_API_KEY||"";if(!key)return res.status(503).json({error:"Admin key is not configured."});const provided=String(req.header("X-ClashIQ-Admin-Key")||"");if(!provided||provided!==key)return res.status(401).json({error:"Unauthorized"});return true;}
router.get("/admin/ai-usage",(req,res)=>{if(admin(req,res)!==true)return;res.json(getAiUsage());});
router.post("/admin/ai-usage/controls",(req,res)=>{if(admin(req,res)!==true)return;setAiUsageControls({daily:req.body?.daily,hourly:req.body?.hourly,enabled:req.body?.enabled});res.json(getAiUsage());});
export default router;
