'use client'
import { useState, useEffect } from 'react'
import {
  Library, Trash2, Download, BookOpen, GitCompare, Mic2, X,
  FolderOpen, FileText, AlertCircle,
} from 'lucide-react'
import {
  getEstudios, getComparados, getSermones,
  eliminarEstudio, eliminarSermon,
  type EstudioGuardado, type SermonGuardado,
} from '@/lib/storage'
import { construirDocxBlob, exportarBibliotecaWord } from '@/lib/exportDocx'

// ─── File System Access API helpers ────────────────────────────────────────────
const IDB_DB    = 'ebp_fs'
const IDB_STORE = 'handles'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  })
}

async function getDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db  = await openIDB()
    return new Promise((res) => {
      const tx  = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get('dir')
      req.onsuccess = () => res((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror   = () => res(null)
    })
  } catch { return null }
}

async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB()
    await new Promise<void>((res) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(handle, 'dir')
      tx.oncomplete = () => res()
    })
  } catch { /* silencioso */ }
}

async function clearDirHandle(): Promise<void> {
  try {
    const db = await openIDB()
    await new Promise<void>((res) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete('dir')
      tx.oncomplete = () => res()
    })
  } catch { /* silencioso */ }
}

const fsSupportada = (): boolean =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window

async function verificarPermiso(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handle as any
    const perm = await h.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return true
    const req = await h.requestPermission({ mode: 'readwrite' })
    return req === 'granted'
  } catch { return false }
}

async function guardarEnCarpeta(
  handle: FileSystemDirectoryHandle,
  fileName: string,
  blob: Blob,
): Promise<void> {
  const fileHandle = await handle.getFileHandle(fileName, { create: true })
  const writable   = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

// ─── Componente ────────────────────────────────────────────────────────────────

interface Props {
  onSelectEstudio:   (estudio: EstudioGuardado) => void
  onSelectComparado: (estudio: EstudioGuardado) => void
  onSelectSermon?:   (sermon: SermonGuardado) => void
  onClose: () => void
}

type TabLib = 'estudios' | 'comparados' | 'sermones'

export default function LibrarySidebar({ onSelectEstudio, onSelectComparado, onSelectSermon, onClose }: Props) {
  const [tab, setTab] = useState<TabLib>('estudios')
  const [estudios,   setEstudios]   = useState<EstudioGuardado[]>([])
  const [comparados, setComparados] = useState<EstudioGuardado[]>([])
  const [sermones,   setSermones]   = useState<SermonGuardado[]>([])

  const [dirHandle,   setDirHandle]   = useState<FileSystemDirectoryHandle | null>(null)
  const [dirName,     setDirName]     = useState<string>('')
  const [carpetaMsg,  setCarpetaMsg]  = useState<string>('')

  const [descargando, setDescargando] = useState<Record<string, boolean>>({})
  const [exportando,  setExportando]  = useState(false)

  useEffect(() => {
    setEstudios(getEstudios())
    setComparados(getComparados())
    setSermones(getSermones())

    getDirHandle().then((h) => {
      if (h) { setDirHandle(h); setDirName(h.name) }
    })
  }, [])

  const recargar = () => {
    setEstudios(getEstudios())
    setComparados(getComparados())
    setSermones(getSermones())
  }

  // ── Seleccionar carpeta ────────────────────────────────────────────────────
  const elegirCarpeta = async () => {
    if (!fsSupportada()) {
      setCarpetaMsg('⚠️ Tu navegador no soporta elección de carpeta. Los archivos se descargarán en la carpeta de Descargas.')
      return
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
      await saveDirHandle(handle)
      setDirHandle(handle)
      setDirName(handle.name)
      setCarpetaMsg(`✅ Carpeta seleccionada: ${handle.name}`)
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setCarpetaMsg('❌ No se pudo acceder a la carpeta.')
      }
    }
    setTimeout(() => setCarpetaMsg(''), 3500)
  }

  const quitarCarpeta = async () => {
    await clearDirHandle()
    setDirHandle(null)
    setDirName('')
    setCarpetaMsg('Carpeta eliminada. Se usará la carpeta de Descargas.')
    setTimeout(() => setCarpetaMsg(''), 3000)
  }

  // ── Descarga individual (sirve para estudios, comparados y sermones) ───────
  const descargarItem = async (cita: string, texto: string, prefijoArchivo: string, clave: string) => {
    setDescargando(prev => ({ ...prev, [clave]: true }))
    try {
      const blob     = await construirDocxBlob(cita, texto)
      const fileName = `${prefijoArchivo}_${cita.replace(/[:\s]/g, '_')}.docx`

      if (dirHandle) {
        const permiso = await verificarPermiso(dirHandle)
        if (permiso) {
          await guardarEnCarpeta(dirHandle, fileName, blob)
          setCarpetaMsg(`✅ Guardado en "${dirHandle.name}/${fileName}"`)
          setTimeout(() => setCarpetaMsg(''), 3000)
          return
        } else {
          setCarpetaMsg('⚠️ Sin permiso a la carpeta, descargando normalmente...')
          setTimeout(() => setCarpetaMsg(''), 3000)
        }
      }

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href = url; a.download = fileName; a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDescargando(prev => ({ ...prev, [clave]: false }))
    }
  }

  // ── Exportar toda la biblioteca ────────────────────────────────────────────
  const exportarTodo = async () => {
    const todos = [
      ...estudios,
      ...comparados,
      ...sermones.map(s => ({ cita: `${s.cita} (${s.estilo})`, texto: s.texto, fecha: s.fecha, anotaciones: [] })),
    ]
    if (todos.length === 0) return
    setExportando(true)
    try {
      await exportarBibliotecaWord(todos)
    } finally {
      setExportando(false)
    }
  }

  const eliminar = (cita: string) => {
    eliminarEstudio(cita)
    recargar()
  }

  const eliminarSermonItem = (cita: string, estilo: string) => {
    eliminarSermon(cita, estilo)
    recargar()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const totalItems = estudios.length + comparados.length + sermones.length

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
      background: 'var(--navy-card)', borderLeft: '1px solid var(--navy-border)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.3s ease-out',
    }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4"
        style={{ borderBottom: '1px solid var(--navy-border)' }}>
        <div className="flex items-center gap-2">
          <Library size={18} style={{ color: 'var(--gold)' }} />
          <span className="font-semibold" style={{ color: 'var(--gold)' }}>Mi Biblioteca</span>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '5px 8px' }}>
          <X size={15} />
        </button>
      </div>

      {/* ── Selector de carpeta ── */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: '1px solid var(--navy-border)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
          CARPETA DE DESCARGA
        </p>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary flex-1 justify-start gap-2"
            style={{ fontSize: 12, padding: '7px 10px', overflow: 'hidden' }}
            onClick={elegirCarpeta}
            title="Elegir carpeta donde guardar los archivos Word"
          >
            <FolderOpen size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: dirName ? 'var(--text-primary)' : 'var(--text-dim)',
            }}>
              {dirName || 'Elegir carpeta...'}
            </span>
          </button>

          {dirName && (
            <button
              className="btn-secondary"
              style={{ padding: '7px 8px', flexShrink: 0 }}
              onClick={quitarCarpeta}
              title="Quitar carpeta seleccionada"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {!fsSupportada() && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f59e0b' }}>
            <AlertCircle size={11} /> Usa Chrome o Edge para elegir carpeta
          </p>
        )}

        {carpetaMsg && (
          <p className="text-xs mt-1" style={{
            color: carpetaMsg.startsWith('✅') ? '#4ade80'
              : carpetaMsg.startsWith('❌') ? '#f87171' : '#f59e0b',
          }}>
            {carpetaMsg}
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-3" style={{ borderBottom: '1px solid var(--navy-border)' }}>
        <button
          className={`tab-btn flex-1 ${tab === 'estudios' ? 'active' : ''}`}
          onClick={() => setTab('estudios')}
        >
          <BookOpen size={12} /> Estudios ({estudios.length})
        </button>
        <button
          className={`tab-btn flex-1 ${tab === 'comparados' ? 'active' : ''}`}
          onClick={() => setTab('comparados')}
        >
          <GitCompare size={12} /> Comparados ({comparados.length})
        </button>
        <button
          className={`tab-btn flex-1 ${tab === 'sermones' ? 'active' : ''}`}
          onClick={() => setTab('sermones')}
        >
          <Mic2 size={12} /> Sermones ({sermones.length})
        </button>
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab !== 'sermones' ? (
          (() => {
            const lista = tab === 'estudios' ? estudios : comparados
            return lista.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>
                Sin {tab} guardados aún
              </p>
            ) : (
              lista.map(e => (
                <div
                  key={e.cita}
                  className="card"
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => tab === 'estudios' ? onSelectEstudio(e) : onSelectComparado(e)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div style={{ minWidth: 0 }}>
                      <p className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>{e.cita}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                        {new Date(e.fecha).toLocaleDateString('es-ES')}
                        {(e.anotaciones?.length ?? 0) > 0 && ` · ${e.anotaciones?.length ?? 0} anotaciones`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 7px', opacity: descargando[e.cita] ? 0.6 : 1 }}
                        disabled={descargando[e.cita]}
                        title={dirName ? `Guardar en "${dirName}"` : 'Descargar como Word'}
                        onClick={ev => { ev.stopPropagation(); descargarItem(e.cita, e.texto, 'Exegesis', e.cita) }}
                      >
                        {descargando[e.cita]
                          ? <span style={{ fontSize: 10 }}>...</span>
                          : <FileText size={12} style={{ color: 'var(--gold)' }} />
                        }
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 7px' }}
                        title="Eliminar"
                        onClick={ev => { ev.stopPropagation(); eliminar(e.cita) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          })()
        ) : (
          sermones.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>
              Sin sermones guardados aún
            </p>
          ) : (
            sermones.map(s => {
              const clave = `${s.cita}__${s.estilo}`
              return (
                <div
                  key={clave}
                  className="card"
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => onSelectSermon?.(s)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div style={{ minWidth: 0 }}>
                      <p className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>{s.cita}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                        {new Date(s.fecha).toLocaleDateString('es-ES')} · {s.estilo}
                      </p>
                    </div>

                    <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 7px', opacity: descargando[clave] ? 0.6 : 1 }}
                        disabled={descargando[clave]}
                        title={dirName ? `Guardar en "${dirName}"` : 'Descargar como Word'}
                        onClick={ev => { ev.stopPropagation(); descargarItem(s.cita, s.texto, 'Sermon', clave) }}
                      >
                        {descargando[clave]
                          ? <span style={{ fontSize: 10 }}>...</span>
                          : <FileText size={12} style={{ color: 'var(--gold)' }} />
                        }
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 7px' }}
                        title="Eliminar"
                        onClick={ev => { ev.stopPropagation(); eliminarSermonItem(s.cita, s.estilo) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )
        )}
      </div>

      {/* ── Footer: Exportar todo como Word ── */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--navy-border)' }}>
        {dirName && (
          <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
            📁 {dirName}
          </p>
        )}
        <button
          className="btn-secondary w-full justify-center"
          style={{ fontSize: 12, opacity: exportando ? 0.7 : 1 }}
          onClick={exportarTodo}
          disabled={exportando || totalItems === 0}
        >
          <Download size={13} />
          {exportando ? 'Generando...' : 'Exportar biblioteca (.docx)'}
        </button>
      </div>
    </div>
  )
}
