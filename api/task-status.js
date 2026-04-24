// 根据 taskId 查询 Seed3D 任务状态，完成后返回 .glb 下载 URL

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ARK_API_KEY = process.env.ARK_API_KEY
  if (!ARK_API_KEY) {
    return res.status(500).json({ error: 'API Key 未配置' })
  }

  const taskId = req.query.taskId
  if (!taskId) {
    return res.status(400).json({ error: '缺少 taskId' })
  }

  try {
    const response = await fetch(
      `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ARK_API_KEY}`
        }
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: '查询失败', detail: result })
    }

    const taskStatus = {
      taskId: result.id,
      status: result.status,
      progress: result.progress || null
    }

    // 任务成功时，从 content 数组中提取模型文件 URL
    if (result.status === 'succeeded' && result.content) {
      const modelContent = result.content.find(
        item => item.type === 'file' || item.type === 'model' || item.url
      )
      if (modelContent) {
        taskStatus.modelUrl = modelContent.url || modelContent.file_url || ''
      }
      // 保留原始数据便于调试
      taskStatus._rawContent = result.content
    }

    if (result.status === 'failed') {
      taskStatus.error = result.error || '生成失败'
    }

    return res.status(200).json(taskStatus)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
