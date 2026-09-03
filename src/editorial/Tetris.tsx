import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const COLS = 10
const ROWS = 18
const CELL = 14

/** Tetromino shapes as rotation-0 coordinate sets, with the design's palette. */
const PIECES: Record<string, { cells: [number, number][]; color: string }> = {
  I: { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: '#5bc8d6' },
  O: { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#e8c341' },
  T: { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], color: '#a8452c' },
  S: { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: '#8da05a' },
  Z: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#e8895c' },
  J: { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: '#6b8fb5' },
  L: { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: '#c98b4b' },
}
const KEYS = Object.keys(PIECES)

type Cell = string | null
type Piece = { cells: [number, number][]; color: string; x: number; y: number }

const emptyBoard = (): Cell[][] => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))

function spawn(): Piece {
  const k = KEYS[Math.floor(Math.random() * KEYS.length)]
  const p = PIECES[k]
  return { cells: p.cells.map(([x, y]) => [x, y] as [number, number]), color: p.color, x: 3, y: 0 }
}

function rotate(piece: Piece): [number, number][] {
  // rotate 90° clockwise about the piece's local bounding box
  const maxY = Math.max(...piece.cells.map(([, y]) => y))
  return piece.cells.map(([x, y]) => [maxY - y, x] as [number, number])
}

function collides(board: Cell[][], cells: [number, number][], px: number, py: number): boolean {
  return cells.some(([cx, cy]) => {
    const x = px + cx
    const y = py + cy
    if (x < 0 || x >= COLS || y >= ROWS) return true
    if (y < 0) return false
    return board[y][x] !== null
  })
}

export default function Tetris() {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard)
  const [piece, setPiece] = useState<Piece | null>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [started, setStarted] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const status = over ? 'game over' : running ? 'playing' : started ? 'paused' : 'press start'
  const label = over ? 'again' : running ? 'pause' : started ? 'resume' : 'start'

  const lockPiece = useCallback((b: Cell[][], p: Piece) => {
    const next = b.map((r) => r.slice())
    for (const [cx, cy] of p.cells) {
      const x = p.x + cx
      const y = p.y + cy
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) next[y][x] = p.color
    }
    const kept = next.filter((row) => row.some((c) => c === null))
    const cleared = ROWS - kept.length
    if (cleared > 0) {
      const fresh = Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null))
      setScore((s) => s + [0, 100, 300, 500, 800][cleared])
      setLines((l) => l + cleared)
      return [...fresh, ...kept]
    }
    return next
  }, [])

  const step = useCallback(() => {
    setPiece((cur) => {
      if (!cur) return cur
      if (!collides(board, cur.cells, cur.x, cur.y + 1)) return { ...cur, y: cur.y + 1 }
      // lock and spawn
      const merged = lockPiece(board, cur)
      setBoard(merged)
      const nxt = spawn()
      if (collides(merged, nxt.cells, nxt.x, nxt.y)) {
        setOver(true)
        setRunning(false)
        return null
      }
      return nxt
    })
  }, [board, lockPiece])

  useEffect(() => {
    if (!running) return
    const speed = Math.max(140, 520 - Math.floor(lines / 4) * 45)
    const id = setInterval(step, speed)
    return () => clearInterval(id)
  }, [running, step, lines])

  const move = useCallback((dx: number) => {
    setPiece((p) => (p && !collides(board, p.cells, p.x + dx, p.y) ? { ...p, x: p.x + dx } : p))
  }, [board])

  const turn = useCallback(() => {
    setPiece((p) => {
      if (!p) return p
      const cells = rotate(p)
      for (const dx of [0, -1, 1, -2, 2]) {
        if (!collides(board, cells, p.x + dx, p.y)) return { ...p, cells, x: p.x + dx }
      }
      return p
    })
  }, [board])

  const drop = useCallback(() => {
    setPiece((p) => {
      if (!p) return p
      let y = p.y
      while (!collides(board, p.cells, p.x, y + 1)) y++
      return { ...p, y }
    })
  }, [board])

  const start = useCallback(() => {
    if (over || !started) {
      setBoard(emptyBoard())
      setScore(0)
      setLines(0)
      setOver(false)
      setPiece(spawn())
      setStarted(true)
      setRunning(true)
      wrapRef.current?.focus()
      return
    }
    setRunning((r) => !r)
    wrapRef.current?.focus()
  }, [over, started])

  // Keyboard only while the board has focus, so the page still scrolls normally.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!running) return
    const handled: Record<string, () => void> = {
      ArrowLeft: () => move(-1),
      ArrowRight: () => move(1),
      ArrowUp: turn,
      ArrowDown: () => step(),
      ' ': drop,
    }
    const fn = handled[e.key]
    if (fn) { e.preventDefault(); fn() }
  }

  const view = useMemo(() => {
    const b = board.map((r) => r.slice())
    if (piece) {
      for (const [cx, cy] of piece.cells) {
        const x = piece.x + cx
        const y = piece.y + cy
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) b[y][x] = piece.color
      }
    }
    return b
  }, [board, piece])

  const btn = 'ed-mono'

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-[26px] items-start">
      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Tetris board. Focus and use arrow keys."
        className="flex-none outline-none rounded"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
          gap: 1,
          background: '#1c1a16',
          padding: 4,
          borderRadius: 4,
        }}
      >
        {view.flatMap((row, y) =>
          row.map((c, x) => (
            <div
              key={`${x}-${y}`}
              style={{ background: c ?? '#24231d', borderRadius: 1 }}
            />
          ))
        )}
      </div>

      <div className="flex-1 ed-mono min-w-0">
        <div className="flex gap-[22px] mb-5">
          <div>
            <p className="m-0 mb-1" style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6459' }}>score</p>
            <p className="m-0" style={{ fontSize: 26, fontWeight: 500, color: '#e8c341', letterSpacing: '.04em' }}>{score}</p>
          </div>
          <div>
            <p className="m-0 mb-1" style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6459' }}>lines</p>
            <p className="m-0" style={{ fontSize: 26, fontWeight: 500, color: '#5bc8d6', letterSpacing: '.04em' }}>{lines}</p>
          </div>
        </div>

        <p className="m-0 mb-[18px]" style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e8895c' }}>{status}</p>

        <button
          onClick={start}
          className={btn}
          style={{
            display: 'block', width: 150, margin: '0 0 10px', padding: '11px 0',
            background: '#e8c341', border: 'none', borderBottom: '4px solid #9c8121',
            color: '#100f0c', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          {label}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 36px)', gap: 6, width: 150 }}>
          {([
            ['←', () => move(-1)],
            ['⟳', turn],
            ['→', () => move(1)],
            ['↓', drop],
          ] as [string, () => void][]).map(([glyph, fn]) => (
            <button
              key={glyph}
              onClick={() => { if (running) fn() }}
              aria-label={glyph}
              className={btn}
              style={{
                padding: '9px 0', background: '#24231d', border: 'none',
                borderBottom: '3px solid #100f0c', color: '#faf9f7', fontSize: 13, cursor: 'pointer',
              }}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
