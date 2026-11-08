import { describe, expect, it } from 'vitest'
import { disciplines, exampleProfile, regions } from './data'

describe('Academic Universe seed data', () => {
  it('gives every initial discipline a unique ID at an equal distance from the origin', () => {
    const ids = new Set(disciplines.map(d => d.id))
    expect(ids.size).toBe(disciplines.length)
    const radii = disciplines.map(d => Math.hypot(...d.position))
    expect(Math.max(...radii) - Math.min(...radii)).toBeLessThan(1e-10)
  })

  it('references only existing disciplines from links and sample expertise', () => {
    const ids = new Set(disciplines.map(d => d.id))
    expect(disciplines.every(d => d.related.every(id => ids.has(id)))).toBe(true)
    expect(exampleProfile.expertise.every(e => ids.has(e.disciplineId))).toBe(true)
  })

  it('places eight region centers at radius six with exactly three face-adjacent octants each', () => {
    expect(regions).toHaveLength(8)
    for (const region of regions) {
      expect(Math.hypot(...region.position)).toBeCloseTo(6, 10)
      expect(region.adjacentIds).toHaveLength(3)
    }
  })

  it('uses the requested pastel palette by octant', () => {
    expect(regions.map(r=>r.color)).toEqual(['#A9B8F5','#91C9E8','#91D8B5','#F2AE91','#BBA8E8','#E6C49A','#E9D58D','#E7A6C2'])
  })

  it('keeps disciplines in the sign-defined octant from the specification', () => {
    for (const region of regions) {
      const regionDisciplines=disciplines.filter(d=>d.regionId===region.id)
      expect(regionDisciplines.map(d=>d.name).sort()).toEqual([...region.disciplineNames].sort())
      expect(regionDisciplines.every(d=>d.position.every((coordinate,i)=>Math.sign(coordinate)===region.signs[i]))).toBe(true)
    }
  })
})
