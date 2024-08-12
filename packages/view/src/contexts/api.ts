const baseUrl = 'http://localhost:2023'

export const getNode = async (query: {
    id?: string
    depth?: number
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

export const circularDependency = async () => {
    const res = await fetch(`${baseUrl}/circularDependency`)
    return res.json()

}

export const codependency = async () => {
    const res = await fetch(`${baseUrl}/codependency`)
    return res.json()
}

function stringifyObjToParams(obj: any) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
}