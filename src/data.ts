export type Vec3 = [number, number, number]
export type Region = { id: string; name: string; octant: number; signs: Vec3; position: Vec3; color: string; disciplineNames: string[]; adjacentIds: string[] }
export type Discipline = { id: string; name: string; cluster: string; regionId: string; position: Vec3; related: string[] }
export type Expertise = { disciplineId: string; level: number; evidence: 'formal' | 'inferred'; note?: string }
export type Profile = { id: string; name: string; qualifications: string; fields: string; specializations: string; skills: string; interests: string; experience: string; expertise: Expertise[] }
export type Layer = { id: string; name: string; visible: boolean; opacity: number; profileId?: string; system?: boolean }
export type ChatMessage = { role: 'user' | 'assistant'; text: string }

const sqrt3 = Math.sqrt(3)
// Eight center points at radius 6: (±6/√3, ±6/√3, ±6/√3).
const specs: Omit<Region,'position'|'adjacentIds'>[] = [
  {id:'computing',octant:1,name:'Computing & Mathematical Sciences',signs:[1,1,1],color:'#A9B8F5',disciplineNames:['Computer Science','Data Science','Mathematics and Statistics']},
  {id:'physical',octant:2,name:'Physical & Environmental Sciences',signs:[-1,1,1],color:'#91C9E8',disciplineNames:['Astrophysics','Chemistry','Earth and Environmental Science','Environmental Studies','Physics']},
  {id:'biological',octant:3,name:'Biological & Health Sciences',signs:[-1,-1,1],color:'#91D8B5',disciplineNames:['Animal Behavior Studies','Biochemistry & Molecular Biology','Biology','Neuroscience','Public Health']},
  {id:'mind',octant:4,name:'Mind & Behavioral Sciences',signs:[1,-1,1],color:'#F2AE91',disciplineNames:['Cognitive Science','Moral Psychology','Psychology']},
  {id:'society',octant:5,name:'Society, Politics & Economics',signs:[-1,-1,-1],color:'#BBA8E8',disciplineNames:['Anthropology','Business, Organizations & Society','Economics','Government','Sociology']},
  {id:'humanities',octant:6,name:'Humanities, History & Philosophy',signs:[-1,1,-1],color:'#E6C49A',disciplineNames:['Africana Studies','American Studies','Classics','History','Philosophy','Religious Studies','Women’s, Gender and Sexuality Studies']},
  {id:'languages',octant:7,name:'Languages & Literature',signs:[1,-1,-1],color:'#E9D58D',disciplineNames:['English (Creative Writing or Literature)','French and Francophone Studies','German and German Studies','Italian','Spanish']},
  {id:'arts',octant:8,name:'Arts & Creative Expression',signs:[1,1,-1],color:'#E7A6C2',disciplineNames:['Dance','Film and Media Arts','History of Art and Architecture','Music','Studio Art','Theatre']}
]
export const regions: Region[] = specs.map(spec=>({ ...spec, position:spec.signs.map(sign=>sign*6/sqrt3) as Vec3, adjacentIds:specs.filter(other=>other.signs.filter((sign,i)=>sign!==spec.signs[i]).length===1).map(other=>other.id) }))
export const clusterColor = (regionId: string) => regions.find(r=>r.id===regionId)?.color ?? '#8b9bb0'
const idFor = (name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')
const nodeCoordinates:Record<string,Vec3>={
'Computer Science':[6.5,2.5,3.5],'Data Science':[5.5,4,2.5],'Mathematics and Statistics':[4,5.5,4],
'Astrophysics':[-6.5,3,4],'Chemistry':[-4,5,4],'Earth and Environmental Science':[-3,4,6],'Environmental Studies':[-2.5,2,5.5],'Physics':[-5.5,5.5,3],
'Animal Behavior Studies':[-4,-5.5,3],'Biochemistry & Molecular Biology':[-4,-3.5,5.5],'Biology':[-5.5,-3,4],'Neuroscience':[-2.5,-5,5],'Public Health':[-3,-2.5,6],
'Cognitive Science':[4,-3,5.5],'Moral Psychology':[2.5,-5.5,3.5],'Psychology':[5.5,-4,3],
'Anthropology':[-4,-5,-3],'Business, Organizations & Society':[-6,-2.5,-3],'Economics':[-5,-4,-4],'Government':[-3,-6,-3.5],'Sociology':[-3,-3.5,-5.5],
'Africana Studies':[-5,3,-4],'American Studies':[-3.5,5,-3.5],'Classics':[-6,3.5,-2.5],'History':[-4,5.5,-2.5],'Philosophy':[-3,3,-5.5],'Religious Studies':[-5.5,2,-4],'Women’s, Gender and Sexuality Studies':[-2.5,4,-5],
'English (Creative Writing or Literature)':[4,-3,-5],'French and Francophone Studies':[5.5,-3,-3],'German and German Studies':[3,-5.5,-3],'Italian':[5.5,-4,-2.5],'Spanish':[3,-4,-5.5],
'Dance':[4,5,-4],'Film and Media Arts':[5.5,3,-3],'History of Art and Architecture':[3,5.5,-3.5],'Music':[5.5,4,-2.5],'Studio Art':[3,3.5,-5.5],'Theatre':[4,2.5,-5.5]
}
export const disciplines: Discipline[] = regions.flatMap(region=>region.disciplineNames.map(name=>{
  const position=nodeCoordinates[name]
  const peers=region.disciplineNames.filter(x=>x!==name).slice(0,2)
  const adjacent=regions.filter(r=>region.adjacentIds.includes(r.id)).flatMap(r=>r.disciplineNames).slice(0,2)
  return {id:idFor(name),name,cluster:region.name,regionId:region.id,position,related:[...peers,...adjacent].map(idFor)}
}))
export const initialLayers: Layer[] = [{ id:'universe', name:'Academic Universe', visible:true, opacity:.95, system:true }]
export const exampleProfile: Profile = { id:'sample-ada', name:'Sample: interdisciplinary researcher', qualifications:'PhD in Cognitive Science; BS in Computer Science', fields:'Cognitive Science, Computer Science, Psychology', specializations:'Human-computer interaction', skills:'Programming, experimental design', interests:'Learning and decision making', experience:'Research experience in human-computer interaction', expertise:[{disciplineId:'cognitive-science',level:4,evidence:'formal'},{disciplineId:'computer-science',level:3,evidence:'formal'},{disciplineId:'psychology',level:2,evidence:'inferred'}] }
