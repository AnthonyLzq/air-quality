import { saveClientData } from 'database/postgres'
import { Database } from 'firebase-admin/lib/database/database.js'
import { z } from 'zod'

const clientData = z.object({
  date: z.string(),
  aq: z.number(),
  h2s: z.number(),
  humidity: z.number(),
  temperature: z.number()
})

declare global {
  type ClientData = z.infer<typeof clientData>
}

type Update<T = number> = {
  db: Database
  id: string
  moduleId: string
  sensorId: string
  value: T
}

const getData = async ({
  db,
  id,
  moduleId,
  sensorId
}: Omit<Update, 'value'>): Promise<ClientData> => {
  const result = await db.ref(`/ids/${id}/${moduleId}/${sensorId}`).get()

  return clientData.parse(result.val())
}

const updateDate = ({ db, id, moduleId, sensorId, value }: Update<string>) => {
  db.ref(`/ids/${id}/${moduleId}/${sensorId}/date`).set(value)
}

const updateAQ = ({ db, id, moduleId, sensorId, value }: Update) => {
  db.ref(`/ids/${id}/${moduleId}/${sensorId}/aq`).set(value)
}

const updateH2S = ({ db, id, moduleId, sensorId, value }: Update) => {
  db.ref(`/ids/${id}/${moduleId}/${sensorId}/h2s`).set(value)
}

const updateHumidity = ({ db, id, moduleId, sensorId, value }: Update) => {
  db.ref(`/ids/${id}/${moduleId}/${sensorId}/humidity`).set(value)
}

const updateTemperature = ({
  db,
  id,
  moduleId,
  sensorId,
  value,
  date
}: Update & { date: Date }) => {
  db.ref(`/ids/${id}/${moduleId}/${sensorId}/temperature`).set(value, error => {
    if (error) return console.error('Error on update temperature', error)

    updateDate({ db, id, moduleId, sensorId, value: date.toISOString() })
  })
}

const listenChangesInDate = ({
  db,
  id,
  moduleId,
  sensorId
}: Omit<Update, 'value'>) => {
  db.ref(`/ids/${id}/${moduleId}/${sensorId}/date`).on('value', async () => {
    const data = await getData({ db, id, moduleId, sensorId })

    try {
      await saveClientData(z.coerce.number().parse(sensorId), data)
    } catch (error) {
      console.error('Error: ', error)
    }
  })
}

export {
  getData,
  updateAQ,
  updateH2S,
  updateHumidity,
  updateTemperature,
  updateDate,
  listenChangesInDate
}