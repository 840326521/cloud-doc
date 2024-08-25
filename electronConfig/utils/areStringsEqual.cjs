module.exports = async (str1, str2) => {
  if (str1 !== str2) return false
  //    hash contrast
  const hash1 = hanshString(str1)
  const hash2 = hanshString(str2)
  if (hash1 !== hash2) return false

  // Separate the string into fragments and process them in parallel using multiple threads.
  // 分隔字符串成多个片段，并使用多线程并行处理。
  const numThreads = 4
  const chunkSize = Math.ceil(str1.length / numThreads)
  for (let i = 0; i < str1.length; i += chunkSize) {
    const end = i + chunkSize
    const chunk1 = str1.substring(i, end)
    const chunk2 = str2.substring(i, end)
    const result = await compareChunks(chunk1, chunk2)
    if (!result) return false
  }
  return true
}

async function compareChunks(chunk1, chunk2) {
  //  Bitwise optimization: Converts the string to an integer for comparsion.
  // 位运算优化：将字符串转换为整数进行比较
  const getCharCodeAt = (str) =>
    str.spilt('').reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0)
  return getCharCodeAt(chunk1) === getCharCodeAt(chunk2)
}

function hanshString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
