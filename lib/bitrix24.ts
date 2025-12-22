// Bitrix24 интеграция

interface Bitrix24Config {
  webhookUrl: string
  portalDomain?: string
}

interface Bitrix24Task {
  title: string
  description?: string
  responsibleId?: string
  creatorId?: string
  groupId?: string
  deadline?: string
  priority?: number
  tags?: string[]
}

interface Bitrix24Deal {
  title: string
  stageId?: string
  categoryId?: string
  contactId?: string
  assignedById?: string
  fields?: Record<string, any>
}

/**
 * Отправка задачи в Bitrix24
 */
export async function createBitrix24Task(
  config: Bitrix24Config,
  task: Bitrix24Task
): Promise<any> {
  try {
    if (!config.webhookUrl) {
      throw new Error('Bitrix24 webhook URL не настроен')
    }

    const apiUrl = `${config.webhookUrl}/tasks.task.add`

    const payload: any = {
      fields: {
        TITLE: task.title,
        DESCRIPTION: task.description || '',
      },
    }

    if (task.responsibleId) {
      payload.fields.RESPONSIBLE_ID = task.responsibleId
    }

    if (task.creatorId) {
      payload.fields.CREATED_BY = task.creatorId
    }

    if (task.groupId) {
      payload.fields.GROUP_ID = task.groupId
    }

    if (task.deadline) {
      payload.fields.DEADLINE = task.deadline
    }

    if (task.priority) {
      payload.fields.PRIORITY = task.priority
    }

    if (task.tags && task.tags.length > 0) {
      payload.fields.TAGS = task.tags
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.result && result.result.task) {
      return result.result.task
    } else {
      throw new Error(result.error_description || 'Failed to create task')
    }
  } catch (error) {
    console.error('Error creating Bitrix24 task:', error)
    throw error
  }
}

/**
 * Создание сделки в Bitrix24
 */
export async function createBitrix24Deal(
  config: Bitrix24Config,
  deal: Bitrix24Deal
): Promise<any> {
  try {
    if (!config.webhookUrl) {
      throw new Error('Bitrix24 webhook URL не настроен')
    }

    const apiUrl = `${config.webhookUrl}/crm.deal.add`

    const payload: any = {
      fields: {
        TITLE: deal.title,
      },
    }

    if (deal.stageId) {
      payload.fields.STAGE_ID = deal.stageId
    }

    if (deal.categoryId) {
      payload.fields.CATEGORY_ID = deal.categoryId
    }

    if (deal.contactId) {
      payload.fields.CONTACT_ID = deal.contactId
    }

    if (deal.assignedById) {
      payload.fields.ASSIGNED_BY_ID = deal.assignedById
    }

    if (deal.fields) {
      Object.assign(payload.fields, deal.fields)
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.result) {
      return { id: result.result }
    } else {
      throw new Error(result.error_description || 'Failed to create deal')
    }
  } catch (error) {
    console.error('Error creating Bitrix24 deal:', error)
    throw error
  }
}

/**
 * Обновление сделки в Bitrix24
 */
export async function updateBitrix24Deal(
  config: Bitrix24Config,
  dealId: string,
  fields: Record<string, any>
): Promise<boolean> {
  try {
    if (!config.webhookUrl) {
      throw new Error('Bitrix24 webhook URL не настроен')
    }

    const apiUrl = `${config.webhookUrl}/crm.deal.update`

    const payload = {
      id: dealId,
      fields,
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    return result.result === true
  } catch (error) {
    console.error('Error updating Bitrix24 deal:', error)
    throw error
  }
}

/**
 * Получение контакта по email
 */
export async function getBitrix24ContactByEmail(
  config: Bitrix24Config,
  email: string
): Promise<any> {
  try {
    if (!config.webhookUrl) {
      throw new Error('Bitrix24 webhook URL не настроен')
    }

    const apiUrl = `${config.webhookUrl}/crm.contact.list`

    const payload = {
      filter: {
        EMAIL: email,
      },
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL'],
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.result && result.result.length > 0) {
      return result.result[0]
    }

    return null
  } catch (error) {
    console.error('Error getting Bitrix24 contact:', error)
    throw error
  }
}

/**
 * Создание контакта в Bitrix24
 */
export async function createBitrix24Contact(
  config: Bitrix24Config,
  contactData: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
): Promise<any> {
  try {
    if (!config.webhookUrl) {
      throw new Error('Bitrix24 webhook URL не настроен')
    }

    const apiUrl = `${config.webhookUrl}/crm.contact.add`

    const payload = {
      fields: {
        NAME: contactData.firstName,
        LAST_NAME: contactData.lastName,
        EMAIL: [{ VALUE: contactData.email, VALUE_TYPE: 'WORK' }],
      },
    }

    if (contactData.phone) {
      (payload.fields as any).PHONE = [{ VALUE: contactData.phone, VALUE_TYPE: 'WORK' }]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.result) {
      return { id: result.result }
    } else {
      throw new Error(result.error_description || 'Failed to create contact')
    }
  } catch (error) {
    console.error('Error creating Bitrix24 contact:', error)
    throw error
  }
}

/**
 * Шаблоны для интеграции с курсами
 */

export async function syncCourseCompletionToBitrix24(
  config: Bitrix24Config,
  studentData: {
    firstName: string
    lastName: string
    email: string
  },
  courseData: {
    title: string
    score?: number
    completionDate: string
  }
): Promise<any> {
  try {
    // Находим или создаем контакт в Bitrix24
    let contact = await getBitrix24ContactByEmail(config, studentData.email)

    if (!contact) {
      const newContact = await createBitrix24Contact(config, {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
      })
      contact = { ID: newContact.id }
    }

    // Создаем сделку о завершении курса
    const deal = await createBitrix24Deal(config, {
      title: `Завершение курса: ${courseData.title}`,
      contactId: contact.ID,
      fields: {
        COMMENTS: `Студент ${studentData.firstName} ${studentData.lastName} завершил курс "${courseData.title}".\nОценка: ${courseData.score || 'N/A'}\nДата: ${courseData.completionDate}`,
      },
    })

    return deal
  } catch (error) {
    console.error('Error syncing course completion to Bitrix24:', error)
    throw error
  }
}

