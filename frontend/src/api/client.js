import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const sendMessage = (message, userId, condition, sessionContext, language) =>
  api.post('/chat/', { message, user_id: userId, condition, session_context: sessionContext, language })

export const detectCondition = (initialMessage) =>
  api.post('/symptom/detect', { initial_message: initialMessage })

export const submitSymptoms = (condition, answers, userId) =>
  api.post('/symptom/submit', { condition, answers, user_id: userId })

export const signup = (email, password) =>
  api.post('/auth/signup', { email, password })

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const logout = () =>
  api.post('/auth/logout')

export const getReminders = (userId) =>
  api.get(`/reminders/${userId}`)

export const createReminder = (data) =>
  api.post('/reminders/', data)

export const deleteReminder = (reminderId, userId) =>
  api.delete(`/reminders/${reminderId}?user_id=${userId}`)

export const getChatHistory = (userId) =>
  api.get(`/history/chat/${userId}`)

export default api
