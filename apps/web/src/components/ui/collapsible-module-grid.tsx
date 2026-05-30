'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ModuleGrid } from './module-grid'

export function CollapsibleModuleGrid() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full pl-0.5 mb-5 group"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
          Module Directory
        </p>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-all ${open ? 'rotate-180' : ''}`} />
        <span className="text-[10px] text-slate-400 ml-auto">{open ? 'Collapse' : 'Show all 19 modules'}</span>
      </button>
      {open && <ModuleGrid />}
    </div>
  )
}
