export function tokenize(str) {
  return str.match(/\S+|\s+/g) || []
}

export function computeDiff(original, suggested) {
  const a = tokenize(original)
  const b = tokenize(suggested)
  const m = a.length
  const n = b.length

  // Guard against O(m×n) blowup on large token counts (code, dense punctuation).
  // Fall back to a single replace hunk rather than blocking the UI thread.
  if (m * n > 4_000_000) {
    return [
      ...a.map(text => ({ type: 'remove', text })),
      ...b.map(text => ({ type: 'add', text })),
    ]
  }

  // Flat Int32Array: 4-8× faster allocation and better GC vs nested JS arrays.
  // dp[i*(n+1)+j] replaces dp[i][j].
  const dp = new Int32Array((m + 1) * (n + 1))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i * (n + 1) + j] = a[i - 1] === b[j - 1]
        ? dp[(i - 1) * (n + 1) + (j - 1)] + 1
        : Math.max(dp[(i - 1) * (n + 1) + j], dp[i * (n + 1) + (j - 1)])

  const ops = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: 'equal', text: a[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i * (n + 1) + (j - 1)] >= dp[(i - 1) * (n + 1) + j])) {
      ops.unshift({ type: 'add', text: b[j - 1] })
      j--
    } else {
      ops.unshift({ type: 'remove', text: a[i - 1] })
      i--
    }
  }
  return ops
}

export function groupOps(ops) {
  const result = []
  let hunkId = 0
  let i = 0
  while (i < ops.length) {
    if (ops[i].type === 'equal') {
      result.push({ type: 'equal', text: ops[i].text })
      i++
    } else {
      const removes = []
      const adds = []
      while (i < ops.length && ops[i].type !== 'equal') {
        if (ops[i].type === 'remove') removes.push(ops[i].text)
        else adds.push(ops[i].text)
        i++
      }
      result.push({ type: 'hunk', id: hunkId++, removes, adds })
    }
  }
  return result
}

export function buildResult(groupedOps, rejectedIds) {
  return groupedOps.map(item => {
    if (item.type === 'equal') return item.text
    return rejectedIds.has(item.id) ? item.removes.join('') : item.adds.join('')
  }).join('')
}
