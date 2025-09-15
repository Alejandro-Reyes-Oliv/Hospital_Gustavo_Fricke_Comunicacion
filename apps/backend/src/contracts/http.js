// src/contracts/http.js
export const ok = (res, data) => res.json(data)
export const created = (res, data) => res.status(201).json(data)
export const noContent = (res) => res.status(204).end()


export const pageOut = ({ data, page = 1, pageSize = 20, total = 0 }) => ({ data, page, pageSize, total })