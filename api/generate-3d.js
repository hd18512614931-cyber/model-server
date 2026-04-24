// 接收图片 URL（或 base64 data URL），调用 Seed3D 2.0 创建生成任务

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ARK_API_KEY = process.env.ARK_API_KEY
  if (!ARK_API_KEY) {
    return res.status(500).json({ error: 'API Key 未配置' })
  }

  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({ error: '缺少 imageUrl' })
    }

    const response = await fetch(
      'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ARK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'doubao-seed3d-2-0-260328',
          content: [
            {
              type: 'text',
              text: ' --meshquality high --fileformat glb'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('Seed3D API 错误:', result)
      return res.status(response.status).json({
        error: 'Seed3D API 调用失败',
        detail: result
      })
    }

    return res.status(200).json({
      success: true,
      taskId: result.id,
      status: result.status || 'queued'
    })
  } catch (err) {
    console.error('generate-3d 错误:', err)
    return res.status(500).json({ error: err.message })
  }
}
