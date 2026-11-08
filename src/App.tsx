import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, MeshBasicMaterial, Vector3 } from 'three'
import { disciplines, regions, clusterColor } from './data'
import type { Discipline } from './data'

function Node({item,selected,active,onSelect}:{item:Discipline;selected:boolean;active:boolean;onSelect:()=>void}) {
  const [hover,setHover]=useState(false)
  const nodeRef=useRef<Group>(null)
  useFrame((_,dt)=>{const scale=selected?1.55:active?1.3:hover?1.18:1;nodeRef.current?.scale.lerp(new Vector3(scale,scale,scale),1-Math.exp(-dt*8))})
  return <group ref={nodeRef} position={item.position} onClick={e=>{e.stopPropagation();onSelect()}} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(false);document.body.style.cursor='auto'}}><mesh><sphereGeometry args={[.085,20,16]}/><meshStandardMaterial color={selected?'#263f5a':clusterColor(item.regionId)} emissive={selected||active?clusterColor(item.regionId):'#000000'} emissiveIntensity={selected?.45:active?.16:0}/></mesh>{(hover||selected)&&<Html distanceFactor={13}><div className="node-label">{item.name}</div></Html>}</group>
}
function OctantPatch({region,selected,onSelect}:{region:typeof regions[number];selected:boolean;onSelect:()=>void}) {
  const material=useRef<MeshBasicMaterial>(null)
  const geometry=useMemo(()=>{
    const geo=new BufferGeometry(),positions:number[]=[],indices:number[]=[]
    const [x,y,z]=region.signs
    const phi0=x>0?(y>0?0:Math.PI*1.5):(y>0?Math.PI*.5:Math.PI)
    const phi1=phi0+Math.PI/2
    const elev0=z>0?0:-Math.PI/2,elev1=z>0?Math.PI/2:0
    const steps=16,radius=10
    const addGrid=(rows:number,cols:number,point:(row:number,col:number)=>[number,number,number])=>{
      const offset=positions.length/3
      for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++)positions.push(...point(row,col))
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const a=offset+row*(cols+1)+col,b=a+cols+1
        indices.push(a,b,a+1,b,b+1,a+1)
      }
    }
    // Curved spherical boundary of this octant.
    addGrid(steps,steps,(row,col)=>{const e=elev0+(elev1-elev0)*row/steps,p=phi0+(phi1-phi0)*col/steps;return [radius*Math.cos(e)*Math.cos(p),radius*Math.cos(e)*Math.sin(p),radius*Math.sin(e)]})
    // The two radial coordinate-plane faces (phi = phi0 and phi1).
    for(const phi of [phi0,phi1])addGrid(steps,steps,(row,col)=>{const r=radius*row/steps,e=elev0+(elev1-elev0)*col/steps;return [r*Math.cos(e)*Math.cos(phi),r*Math.cos(e)*Math.sin(phi),r*Math.sin(e)]})
    // The equatorial coordinate-plane face (z = 0), closing the upper/lower half.
    addGrid(steps,steps,(row,col)=>{const r=radius*row/steps,p=phi0+(phi1-phi0)*col/steps;return [r*Math.cos(p),r*Math.sin(p),0]})
    geo.setAttribute('position',new Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return geo
  },[region])
  useFrame((_,dt)=>{if(material.current){material.current.color.lerp(new Color(selected?region.color:'#f7f8fa'),1-Math.exp(-dt*5));const target=selected?.34:.13;material.current.opacity+=(target-material.current.opacity)*(1-Math.exp(-dt*5))}})
  return <mesh geometry={geometry} onClick={e=>{e.stopPropagation();onSelect()}}><meshBasicMaterial ref={material} color="#f7f8fa" transparent opacity={.13} side={DoubleSide} depthWrite={false}/></mesh>
}
function App(){
  const [query,setQuery]=useState(''),[selected,setSelected]=useState(''),[activeOctants,setActiveOctants]=useState<Set<string>>(()=>new Set()),[compare,setCompare]=useState<string[]>([]),[showCompare,setShowCompare]=useState(false),[showViews,setShowViews]=useState(false)
  const controls=useMemo(()=>({current:null as OrbitControlsImpl|null}),[]),filters=disciplines.filter(d=>`${d.name} ${d.cluster}`.toLowerCase().includes(query.toLowerCase())),selectedItem=disciplines.find(d=>d.id===selected),compareItems=compare.map(id=>disciplines.find(d=>d.id===id)).filter((d):d is Discipline=>Boolean(d)),comparisonDistance=compareItems.length===2?Math.hypot(compareItems[1].position[0]-compareItems[0].position[0],compareItems[1].position[1]-compareItems[0].position[1],compareItems[1].position[2]-compareItems[0].position[2]):null
  const focus=(item:Discipline)=>{setSelected(item.id);const c=controls.current;if(!c)return;const from=c.target.clone(),dest={x:item.position[0],y:item.position[1],z:item.position[2]},offset=c.object.position.clone().sub(from),start=performance.now(),duration=500;const frame=(now:number)=>{const t=Math.min((now-start)/duration,1),ease=t*t*(3-2*t);c.target.set(from.x+(dest.x-from.x)*ease,from.y+(dest.y-from.y)*ease,from.z+(dest.z-from.z)*ease);c.object.position.set(from.x+(dest.x-from.x)*ease+offset.x,from.y+(dest.y-from.y)*ease+offset.y,from.z+(dest.z-from.z)*ease+offset.z);c.update();if(t<1)requestAnimationFrame(frame)};requestAnimationFrame(frame)}
  const preset=(kind:'reset'|'top'|'side')=>{const c=controls.current;if(!c)return;c.target.set(0,0,0);c.object.up.set(0,0,1);if(kind==='top')c.object.up.set(0,1,0);const pos: [number,number,number]=kind==='reset'?[13,13,14]:kind==='top'?[0,0,22]:[22,0,0];c.object.position.set(...pos);c.update()}
  const toggleOctant=(id:string)=>setActiveOctants(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next})
  const allActive=activeOctants.size===regions.length
  const toggleAll=()=>setActiveOctants(current=>current.size===regions.length?new Set():new Set(regions.map(r=>r.id)))
  return <main className="app-shell"><header className="topbar"><div className="brand-mark">AU</div><div className="brand-copy"><strong>Academic Universe</strong><span>Explore the map of academic knowledge</span></div><div className="top-actions"><button className="soft-button" onClick={()=>setShowCompare(v=>!v)}>⇄ Compare</button><button className="soft-button" onClick={()=>setShowViews(v=>!v)}>⌖ Views</button><button className="icon-button" title="Reset camera" onClick={()=>preset('reset')}>⌂</button></div></header>
  <section className="workspace"><aside className="left-panel"><div className="panel-head"><div><span className="eyebrow">ACADEMIC MAP</span><h2>Explore majors</h2></div><button className="icon-button" title="Clear selection" onClick={()=>{setSelected('');preset('reset')}}>↺</button></div><label className="search-box"><span>⌕</span><input aria-label="Search majors" placeholder="Search all 39 majors" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="discipline-list"><div className="section-label">MAJORS <span>{filters.length} / 39</span></div>{filters.map(d=><button key={d.id} className={`discipline-row ${selected===d.id?'active':''}`} onClick={()=>focus(d)}><i style={{background:clusterColor(d.regionId)}}/><span>{d.name}</span><b>›</b></button>)}</div></aside>
  <section className="center-column"><div className="canvas-wrap"><Canvas camera={{position:[13,13,14],up:[0,0,1],fov:48}} onPointerMissed={()=>setSelected('')}><color attach="background" args={['#fafbfc']}/><ambientLight intensity={1.6}/><directionalLight position={[6,8,9]} intensity={1.8}/><gridHelper args={[20,20,'#e5eaf0','#eef1f5']} position={[0,0,-9.95]} rotation={[Math.PI/2,0,0]}/><axesHelper args={[10.7]}/><mesh><sphereGeometry args={[10,40,32]}/><meshBasicMaterial color="#c9d5df" wireframe transparent opacity={.18}/></mesh>{regions.map(r=><OctantPatch key={r.id} region={r} selected={activeOctants.has(r.id)} onSelect={()=>toggleOctant(r.id)}/>)}{regions.map(r=><group key={`region-${r.id}`} position={r.position}><mesh onClick={e=>{e.stopPropagation();toggleOctant(r.id);setSelected('')}}><sphereGeometry args={[.16,20,16]}/><meshStandardMaterial color={r.color} emissive={activeOctants.has(r.id)?r.color:'#000'} emissiveIntensity={activeOctants.has(r.id) ? .3 : 0}/></mesh><Html distanceFactor={17}><div className={`region-label ${activeOctants.has(r.id)?'selected':''}`}><b>{String(r.octant).padStart(2,'0')}</b><span>{r.name}</span></div></Html></group>)}{regions.flatMap(r=>r.adjacentIds.filter(id=>r.id<id).map(id=>{const a=regions.find(x=>x.id===id)!;return <Line key={`${r.id}-${id}`} points={[r.position,a.position]} color="#8994a1" transparent opacity={.42} lineWidth={1}/> }))}{disciplines.map(d=><Node key={d.id} item={d} selected={selected===d.id} active={activeOctants.has(d.regionId)} onSelect={()=>focus(d)}/>)}{selectedItem?.related.map(id=>{const d=disciplines.find(x=>x.id===id);return d?<Line key={`rel-${id}`} points={[selectedItem.position,d.position]} color="#748397" transparent opacity={.48} lineWidth={1.3}/>:null})}{selectedItem && <Line points={[[0,0,0],selectedItem.position]} color={clusterColor(selectedItem.regionId)} lineWidth={3.2} transparent opacity={1} depthTest={false} renderOrder={10}/>}{compareItems.length===2&&<Line points={[compareItems[0].position,compareItems[1].position]} color="#f22638" lineWidth={3.6} transparent opacity={1} depthTest={false} renderOrder={11}/>}{compare.map(id=>{const d=disciplines.find(x=>x.id===id);return d?<mesh key={`compare-${id}`} position={d.position}><sphereGeometry args={[.16,16,12]}/><meshBasicMaterial color="#354d6b" wireframe/></mesh>:null})}<OrbitControls ref={controls} makeDefault enableDamping minDistance={5} maxDistance={36}/></Canvas><div className="canvas-toolbar"><div className="view-label"><span className="live-dot"/> ACADEMIC UNIVERSE <span>/</span> {selectedItem?.name??'8 OCTANTS'}</div><div className="canvas-actions"><button onClick={()=>setShowCompare(v=>!v)}>⇄ Compare</button><button onClick={()=>setShowViews(v=>!v)}>⌖ Views</button><button onClick={()=>preset('reset')}>⌂ Reset</button></div></div><div className="camera-tools"><button onClick={()=>preset('reset')} title="Reset camera">⌂</button><button onClick={()=>preset('top')} title="Top view">Z</button><button onClick={()=>preset('side')} title="Side view">X</button></div><div className="cluster-legend"><button className={allActive?'active':''} onClick={toggleAll}>All</button>{regions.map(r=><button key={r.id} className={activeOctants.has(r.id)?'active':''} onClick={()=>{toggleOctant(r.id);setSelected('')}}><i style={{background:r.color}}/>{String(r.octant).padStart(2,'0')} {r.name}</button>)}</div>{selectedItem&&<div className="detail-strip"><div><span className="eyebrow">OCTANT {String(regions.find(r=>r.id===selectedItem.regionId)?.octant).padStart(2,'0')}</span><h3>{selectedItem.name}</h3></div><p>Connected majors: {selectedItem.related.map(id=>disciplines.find(d=>d.id===id)?.name).filter(Boolean).join(' · ')}</p><button className="icon-button" onClick={()=>setSelected('')}>×</button></div>}{showCompare&&<div className="compare-strip"><strong>Compare majors</strong>{[0,1].map(i=><select key={i} value={compare[i]??''} onChange={e=>setCompare(v=>{const n=[...v];n[i]=e.target.value;return n})}><option value="">Choose a major</option>{disciplines.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>)}{comparisonDistance!==null&&<span className="comparison-distance"><b>3D Distance: {comparisonDistance.toFixed(2)} units</b><small>Relative distance in Academic Universe coordinates</small></span>}<button className="icon-button" onClick={()=>setShowCompare(false)}>×</button></div>}{showViews&&<div className="views-popover"><button onClick={()=>{preset('reset');setShowViews(false)}}>Reset overview</button><button onClick={()=>{preset('top');setShowViews(false)}}>Top view · Z</button><button onClick={()=>{preset('side');setShowViews(false)}}>Side view · X</button></div>}</div></section></section></main>
}
export default App





