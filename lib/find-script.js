function findLastScript() {
  for (let i = document.all.length - 1; i >= 0; i -= 1) {
    const tag = document.all[i]
    if (tag.tagName && tag.tagName.toUpperCase() === 'SCRIPT') return tag
  }
  return null
}

export default findLastScript()
