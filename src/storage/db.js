import { openDB } from 'idb'

const DB_NAME = 'overstack'
const DB_VERSION = 1

export const STORES = {
  GOALS: 'goals',
  SAVINGS: 'savings',
  SETTINGS: 'settings',
}

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.GOALS)) {
          const goals = db.createObjectStore(STORES.GOALS, { keyPath: 'id' })
          goals.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains(STORES.SAVINGS)) {
          const savings = db.createObjectStore(STORES.SAVINGS, { keyPath: 'id' })
          savings.createIndex('goalId', 'goalId')
          savings.createIndex('date', 'date')
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAll(store) {
  const db = await getDB()
  return db.getAll(store)
}

export async function getById(store, id) {
  const db = await getDB()
  return db.get(store, id)
}

export async function put(store, value) {
  const db = await getDB()
  return db.put(store, value)
}

export async function remove(store, id) {
  const db = await getDB()
  return db.delete(store, id)
}

export async function clearStore(store) {
  const db = await getDB()
  return db.clear(store)
}

export function uid() {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
  )
}
