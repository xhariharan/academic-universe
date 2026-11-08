import OpenAI from 'openai'
import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const Body = z.object({ mode:z.enum(['profile','command']), text:z.string().min(1).max(8000), disciplines:z.array(z.object({id:z.string(),name:z.string()})).optional(), context:z.object({layers:z.array(z.object({id:z.string(),name:z.string()})),disciplines:z.array(z.object({id:z.string(),name:z.string()})),profiles:z.array(z.object({id:z.string(),name:z.string()}))}).optional() })
const Profile = z.object({name:z.string(),qualifications:z.string().default(''),fields:z.string().default(''),specializations:z.string().default(''),skills:z.string().default(''),interests:z.string().default(''),experience:z.string().default(''),expertise:z.array(z.object({disciplineId:z.string(),level:z.number().int().min(1).max(5),evidence:z.enum(['formal','inferred']),note:z.string().optional()}))})
const Command = z.object({action:z.enum(['highlight','navigate','layer_visibility','create_layer','delete_layer','compare','explore','reset','unsupported']),targetId:z.string().optional(),name:z.string().optional(),visible:z.boolean().optional(),message:z.string().optional()})
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='POST')return res.status(405).json({error:'Use POST.'})
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI is not configured. Add OPENAI_API_KEY to the server environment.'})
  const parsed=Body.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Request did not match the supported format.'})
  const body=parsed.data;const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY})
  try{
    if(body.mode==='profile'){
      const ids=new Set((body.disciplines??[]).map(d=>d.id));
      const response=await ai.responses.create({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',input:[{role:'system',content:`Extract only claims supported by the text into a profile. Match expertise to provided discipline IDs only. Mark explicit degrees/field qualifications as formal; mark skills, interests and experience-based matches as inferred. Do not invent credentials. Return JSON matching: {name,qualifications,fields,specializations,skills,interests,experience,expertise:[{disciplineId,level 1-5,evidence formal|inferred,note?}]}. Allowed disciplines: ${JSON.stringify(body.disciplines??[])}`},{role:'user',content:body.text}],text:{format:{type:'json_object'}}})
      const data=Profile.safeParse(JSON.parse(response.output_text));if(!data.success)return res.status(502).json({error:'AI response could not be validated.'});
      const clean={...data.data,expertise:data.data.expertise.filter(e=>ids.has(e.disciplineId))};return res.status(200).json({profile:clean})
    }
    const context=body.context!;const response=await ai.responses.create({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',input:[{role:'system',content:`Translate the request into one safe workspace command JSON: {action, targetId?, name?, visible?, message?}. Only actions: highlight, navigate, layer_visibility, create_layer, delete_layer, compare, explore, reset, unsupported. Match names to IDs exactly from context. Never invent IDs. For destructive operations use delete_layer; client confirms. User says explore a discipline means explore. Context: ${JSON.stringify(context)}`},{role:'user',content:body.text}],text:{format:{type:'json_object'}}})
    const data=Command.safeParse(JSON.parse(response.output_text));if(!data.success)return res.status(502).json({error:'AI command could not be validated.'});const c=data.data
    if(['highlight','navigate','explore'].includes(c.action)&&(!c.targetId||!context.disciplines.some(d=>d.id===c.targetId)))return res.status(200).json({command:{action:'unsupported',message:'I could not match that request to a known discipline.'}})
    if(['layer_visibility','delete_layer'].includes(c.action)&&(!c.targetId||!context.layers.some(l=>l.id===c.targetId)))return res.status(200).json({command:{action:'unsupported',message:'I could not match that request to a known layer.'}})
    return res.status(200).json({command:c})
  }catch(error){console.error('AI route error',error);return res.status(502).json({error:'The AI service could not complete that request.'})}
}
