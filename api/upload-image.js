// 接收小程序传来的 base64 图片，返回 data URL
// 小程序端用 wx.getFileSystemManager().readFileSync 读取图片为 base64，
// 然后通过 wx.request POST JSON 发送到这里

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageBase64 } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: '缺少图片数据' })
    }

    const dataUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`

    return res.status(200).json({
      success: true,
      imageUrl: dataUrl
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
