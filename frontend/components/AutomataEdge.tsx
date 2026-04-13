'use client'

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from 'reactflow'

export default function AutomataEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
    label,
    style,
  } = props

  const bend = typeof data?.bend === 'number' ? data.bend : 0

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.35 + Math.abs(bend) * 0.35,
  })

  const labelOffsetY = bend * 32

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + labelOffsetY}px)`,
              pointerEvents: 'all',
              padding: '4px 6px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#f4f4f5',
              background: '#18181b',
              border: '1px solid #52525b',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}