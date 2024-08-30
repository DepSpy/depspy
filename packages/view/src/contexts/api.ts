const baseUrl = 'http://localhost:2023'

export const getNode = async (query: {
    id?: string
    depth?: number
    path?: string[] | ''
}) => {
    const res = await fetch(`${baseUrl}/getNode?${stringifyObjToParams(query)}`)
    return res.json()
}

export const searchNode = async (query: {
    key?: string
}) => {
    const res = await fetch(`${baseUrl}/searchNode?${stringifyObjToParams(query)}`)
    return res.json()
}

export const updateDepth = async (query: {
    depth: number
}) => {
    const res = await fetch(`${baseUrl}/updateDepth?${stringifyObjToParams(query)}`)
    return res
}


function stringifyObjToParams(obj: any) {
    return Object.entries(obj)
        .map(([key, value]) => {
            if(typeof value === 'object') return `${key}=${JSON.stringify(value)}`
            return `${key}=${value}`
        })
        .join('&')
}